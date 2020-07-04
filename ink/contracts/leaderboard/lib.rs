#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract(version = "0.1.0")]
mod leaderboard {
    use ink_core::storage;

    /// Defines the storage of your contract.
    /// Add new fields to the below struct in order
    /// to add new static storage fields to your contract.
    #[ink(storage)]
    struct Leaderboard {
        /// Store a contract owner
        owner: storage::Value<AccountId>,

        //// Store a mapping from AccountIds to a u32 of user on the leaderboard in the storage
        account_to_score: storage::HashMap<AccountId, u32>,
    }

    /// Events
    /// See https://substrate.dev/substrate-contracts-workshop/#/2/creating-an-event
    #[ink(event)]
    struct SetAccountScore {
        #[ink(topic)]
        of: AccountId,
        #[ink(topic)]
        score: u32
    }

    /// Errors that can occur upon calling this contract.
    /// Reference: https://github.com/paritytech/ink/blob/master/examples/dns/lib.rs
    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(::scale_info::TypeInfo))]
    pub enum Error {
        /// Returned if caller is not owner while required to.
        CallerIsNotOwner,
    }

    /// Type alias for the contract's result type.
    /// Reference: https://github.com/paritytech/ink/blob/master/examples/dns/lib.rs
    pub type Result<T> = core::result::Result<T, Error>;

    impl Leaderboard {
        /// Constructor

        #[ink(constructor)]
        fn new(&mut self) {
            // IMPORTANT: Initialize all storage values
            // See https://substrate.dev/substrate-contracts-workshop/#/1/storing-a-value?id=initializing-storage
            self.owner.set(self.env().caller());

            self.account_to_score.insert(AccountId::from([0x1; 32]), 0);
        }

        /// Public Functions

        // Get the score for a given AccountId
        #[ink(message)]
        fn get_score_of_account(&self, of: AccountId) -> u32 {
            let value = self.account_score_or_zero(&of);
            value
        }

        // Get the score for the calling AccountId
        #[ink(message)]
        fn get_score_of_sender(&self) -> u32 {
            let caller = self.env().caller();
            let value = self.account_score_or_zero(&caller);
            value
        }

        // Set the score for a given AccountId
        #[ink(message)]
        fn set_score_of_account(&mut self, of: AccountId, score: u32) -> Result<()> {
            let owner = self.get_owner();
            if of != owner {
                return Err(Error::CallerIsNotOwner)
            }
            match self.account_to_score.get(&of) {
                Some(_) => {
                    self.account_to_score.mutate_with(&of, |value| *value = score);
                }
                None => {
                    self.account_to_score.insert(of, score);
                }
            };

            // Emit event
            self.env()
                .emit_event(
                    SetAccountScore {
                        of,
                        score,
                    });

            Ok(())
        }

        // Set the score for the calling AccountId
        #[ink(message)]
        fn set_score_of_sender(&mut self, score: u32) -> Result<()> {
            let caller = self.env().caller();
            let owner = self.get_owner();
            if caller != owner {
                return Err(Error::CallerIsNotOwner)
            }
            match self.account_to_score.get(&caller) {
                Some(_) => {
                    self.account_to_score.mutate_with(&caller, |value| *value = score);
                }
                None => {
                    self.account_to_score.insert(caller, score);
                }
            };

            // Emit event
            self.env()
                .emit_event(
                    SetAccountScore {
                        of: caller,
                        score,
                    });
            
            Ok(())
        }

        /// Private functions

        /// Returns the score for an AccountId or 0 if it is not set.
        fn account_score_or_zero(&self, of: &AccountId) -> u32 {
            let score = self.account_to_score.get(of).unwrap_or(&0);
            *score
        }

        /// Returns the contract owner.
        /// Reference: https://github.com/paritytech/ink/blob/master/examples/dns/lib.rs
        fn get_owner(&self) -> AccountId {
            *self.owner.get()
        }
    }

    /// Unit tests in Rust are normally defined within such a `#[cfg(test)]`
    /// module and test functions are marked with a `#[test]` attribute.
    /// The below code is technically just normal Rust code.
    #[cfg(test)]
    mod tests {
        /// Imports all the definitions from the outer scope so we can use them here.
        use super::*;

        // Free Functions

        /// Returns a dummy AccountId for unit tests
        fn get_dummy_account() -> AccountId {
            [0u8; 32].into()
        }

        #[test]
        fn get_score_of_account_works() {
            let leaderboard = Leaderboard::new();
            assert_eq!(leaderboard.get_score_of_account(get_dummy_account()), 0);
        }

        #[test]
        fn get_score_of_sender_works() {
            let leaderboard = Leaderboard::new();
            assert_eq!(leaderboard.get_score_of_sender(), 0);
        }

        #[test]
        fn set_score_of_sender_works() {
            let mut leaderboard = Leaderboard::new();
            assert_eq!(leaderboard.set_score_of_sender(1), Ok(()));
            assert_eq!(leaderboard.get_score_of_sender(), 1);
        }

        #[test]
        fn set_score_of_account_works() {
            let mut leaderboard = Leaderboard::new();
            assert_eq!(leaderboard.set_score_of_account(get_dummy_account(), 2), Ok(()));
            assert_eq!(leaderboard.get_score_of_account(get_dummy_account()), 2);
        }

        // TODO - Add tests for Events
        // See: https://paritytech.github.io/ink/ink_core/env/test/fn.recorded_events.html
        // Pending this issue to export the necessary EmittedEvent type from ink_core
        // https://github.com/paritytech/ink/issues/468
    }
}
