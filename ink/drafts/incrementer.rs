use incrementer {
	use ink::storage::Mapping;

	#[ink(storage)]
	pub struct Incrementer {
		value: i32,
		accounts: Mapping<AccountId, i32>,
	}

	#[ink(event)]
	pub struct Incremented {
		by: i32,
		value: i32,
	}

	impl Incrementer {
		#[ink(contructor)]
		pub fn new(value: i32) -> Self {
			Self {
				value,
				accounts: Mapping::default(),
			}
		}

		#[ink(message)]
		pub fn inc(&mut self, by: i32) {
			self.value += by;
			let caller = self.env().caller();
			// retrieve from accounts mapping
			let mut value: i32 = self.accounts.get(key: &caller).unwrap_or(default:0);
			value += by;
			self.accounts.insert(key: caller, value: &value);
			ink::env::debug_println("inc by {}, new value {}", by, self.value);
			self.env().emit_event(Incremented { by, value: self.value })
		}

		#[ink(message)]
		pub fn get(&self) -> i32 {
			self.value
		}

		#[ink(message)]
		pub fn get_by_caller(&self) -> Option<i32> {
			let caller = self.env().caller();
			self.accounts.get(key: &caller)
		}
	}
}