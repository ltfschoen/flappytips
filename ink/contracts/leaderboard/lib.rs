#![cfg_attr(not(feature = "std"), no_std)]

// ink types: https://github.com/paritytech/ink/blob/master/core/src/env/types.rs

use ink_lang as ink;

#[ink::contract(version = "0.1.0")]
mod leaderboard {
    use ink_core::storage;
    // Important Note: Do not use HashMap. If you want to return `std::collection::HashMap`
    // you should instead use `ink_prelude::collections::BTreeMap` and use `PartialOrd + Eq`
    // instead of `Hash` for its keys
    use ink_prelude::string::String;
    use ink_prelude::vec::Vec;

    #[cfg_attr(feature = "ink-generate-abi", derive(type_metadata::Metadata))]
    #[derive(Debug, Clone, Copy, scale::Encode, scale::Decode, PartialEq, Eq, PartialOrd, Ord)]
    // Alternatively: `#[derive(scale::Codec)]`
    pub struct AccountToScore (
        AccountId,
        u32
    );

    #[cfg_attr(feature = "ink-generate-abi", derive(type_metadata::Metadata))]
    #[derive(Debug, Clone, scale::Encode, scale::Decode, PartialEq, Eq, PartialOrd, Ord)]
    pub struct AccountToUsername (
        AccountId,
        String
    );

    /// Defines the storage of your contract.
    /// Add new fields to the below struct in order
    /// to add new static storage fields to your contract.
    #[ink(storage)]
    struct Leaderboard {
        /// Store a contract owner
        owner: storage::Value<AccountId>,

        /// Store delegate contract owners
        owner_delegates: storage::Vec<AccountId>,

        //// Store a mapping from AccountIds to a u32 of user on the leaderboard in the storage
        account_to_score: storage::HashMap<AccountId, u32>,

        //// Store a mapping from AccountIds to a String of user on the leaderboard in the storage
        account_to_username: storage::HashMap<AccountId, Vec<u8>>,

        /// Store AccountIds on the leaderboard in storage
        accounts: storage::Vec<AccountId>,
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

    #[ink(event)]
    struct SetAccountUsername {
        #[ink(topic)]
        of: AccountId,
        #[ink(topic)]
        username: String,
    }

    #[ink(event)]
    struct SetOwnerDelegate {
        #[ink(topic)]
        account: AccountId
    }

    // TODO - restore once ink! 3.0 is released
    // /// Errors that can occur upon calling this contract.
    // /// Reference: https://github.com/paritytech/ink/blob/master/examples/dns/lib.rs
    // #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    // #[cfg_attr(feature = "std", derive(::scale_info::TypeInfo))]
    // pub enum Error {
    //     /// Returned if caller is not owner while required to.
    //     CallerIsNotOwner,
    // }

    // TODO - restore once ink! 3.0 is released
    // /// Type alias for the contract's result type.
    // /// Reference: https://github.com/paritytech/ink/blob/master/examples/dns/lib.rs
    // pub type Result<T> = core::result::Result<T, Error>;
    pub type Result<T, U> = core::result::Result<T, U>;

    impl Leaderboard {
        /// Constructor

        /// Create instance of contract. Set the caller as contract owner.
        #[ink(constructor)]
        fn new(&mut self) {
            let caller = self.env().caller();
            match self.set_owner(caller) {
                Ok(_) => {
                    // IMPORTANT: Initialize all storage values
                    // See https://substrate.dev/substrate-contracts-workshop/#/1/storing-a-value?id=initializing-storage
                    self.accounts.push(caller);
                    self.account_to_score.insert(caller, 0);
                    self.account_to_username.insert(caller, Vec::new());
                }
                Err(e) => {
                    panic!("Error: Unable to set owner of contract {:?}", e);
                }
            };
        }

        /// Public Functions

        /// Get the score for a given AccountId
        #[ink(message)]
        fn get_score_of_account(&self, of: AccountId) -> u32 {
            let value = self.account_score_or_zero(&of);
            value
        }

        /// Get the username for a given AccountId
        #[ink(message)]
        fn get_username_of_account(&self, of: AccountId) -> String {
            let value = self.account_username_or_zero(&of);
            // https://paritytech.github.io/ink/ink_prelude/string/index.html
            String::from_utf8(value.to_vec()).unwrap()
        }

        /// Get the score for the calling AccountId
        #[ink(message)]
        fn get_score_of_sender(&self) -> u32 {
            let caller = self.env().caller();
            let value = self.account_score_or_zero(&caller);
            value
        }

        /// Get all scores for the all AccountIds
        #[ink(message)]
        fn get_all_scores(&self) -> Result<Vec<AccountToScore>, &'static str> {
            let mut all_account_to_scores: Vec<AccountToScore> = Vec::new();

            let mut account_scores: AccountToScore;
            if self.accounts.is_empty() {
                return Err("Error: Unable to find any accounts");
            }
            for account in self.accounts.iter() {
                let score = self.account_to_score.get(&account);
                match score {
                    None => Err("Error: Unable to find score for account"),
                    Some(_) => {
                        account_scores = AccountToScore (
                            *account,
                            *score.unwrap_or(&0),
                        );
                        all_account_to_scores.push(account_scores);
                        Ok(&all_account_to_scores)
                    },
                };
            }
            Ok(all_account_to_scores)
        }

        /// Get all usernames for the all AccountIds
        #[ink(message)]
        fn get_all_usernames(&self) -> Result<Vec<AccountToUsername>, &'static str> {
            let mut all_account_to_usernames: Vec<AccountToUsername> = Vec::new();
            let _blank: Vec<u8> = Vec::new();

            let mut account_usernames: AccountToUsername;
            if self.accounts.is_empty() {
                return Err("Error: Unable to find any accounts");
            }
            for account in self.accounts.iter() {
                let username = self.account_to_username.get(&account);
                match username {
                    None => Err("Error: Unable to find username for account"),
                    Some(_) => {
                        account_usernames = AccountToUsername (
                            *account,
                            String::from_utf8((&username.unwrap_or(&_blank)).to_vec()).unwrap()
                        );
                        all_account_to_usernames.push(account_usernames);
                        Ok(&all_account_to_usernames)
                    },
                };
            }
            Ok(all_account_to_usernames)
        }

        /// Set the score for a given AccountId
        #[ink(message)]
        fn set_score_of_account(&mut self, of: AccountId, score: u32) -> Result<(), &'static str> {
            if !self.is_owner(&of) && !self.is_owner_delegate(&of) {
                return Err("Error: CallerIsNotOwner and CallerIsNotOwnerDelegate")
            }
            match self.account_to_score.get(&of) {
                Some(_) => {
                    self.account_to_score.mutate_with(&of, |value| *value = score);
                }
                None => {
                    self.account_to_score.insert(of, score);
                    self.accounts.push(of);
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

        /// Set the username for a given AccountId
        #[ink(message)]
        fn set_username_of_account(&mut self, of: AccountId, username: String) -> Result<(), &'static str> {
            let _username: String = username.into();
            if !self.is_owner(&of) && !self.is_owner_delegate(&of) {
                return Err("Error: CallerIsNotOwner and CallerIsNotOwnerDelegate")
            }
            match self.account_to_username.get(&of) {
                Some(_) => {
                    self.account_to_username.mutate_with(&of, |value| *value = _username.into_bytes());
                }
                None => {
                    self.account_to_username.insert(of, _username.into_bytes());
                    self.accounts.push(of);
                }
            };

            // FIXME
            // // Emit event
            // self.env()
            //     .emit_event(
            //         SetAccountUsername {
            //             of,
            //             username: _username,
            //         });

            Ok(())
        }

        /// Set the score for the calling AccountId
        #[ink(message)]
        fn set_score_of_sender(&mut self, score: u32) -> Result<(), &'static str> {
            let caller = self.env().caller();
            if !self.is_owner(&caller) && !self.is_owner_delegate(&caller) {
                return Err("Error: CallerIsNotOwner and CallerIsNotOwnerDelegate")
            }
            match self.account_to_score.get(&caller) {
                Some(_) => {
                    self.account_to_score.mutate_with(&caller, |value| *value = score);
                }
                None => {
                    self.account_to_score.insert(caller, score);
                    self.accounts.push(caller);
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

        /// Get the contract owner AccountId.
        /// Reference: https://github.com/paritytech/ink/blob/master/examples/dns/lib.rs
        #[ink(message)]
        fn get_owner(&self) -> AccountId {
            *self.owner.get()
        }

        /// Set the contract owner AccountId.
        #[ink(message)]
        fn set_owner(&mut self, account: AccountId) -> Result<(), &'static str> {
            self.owner.set(account);
            if self.get_owner() != account {
                return Err("Unable to set owner")
            }
            Ok(())
        }

        /// Get the contract owner's delegates.
        #[ink(message)]
        fn get_owner_delegates(&self) -> Result<Vec<AccountId>, &'static str> {
            // storage::Vec<storage::Value<AccountId>>,
            let mut owner_delegates = Vec::new();

            if self.owner_delegates.is_empty() {
                return Err("Error: Unable to find any owner delegates");
            }
            for delegate in self.owner_delegates.iter() {
                owner_delegates.push(*delegate);
            }
            Ok(owner_delegates)
        }

        /// Set a contract owner's delegate
        #[ink(message)]
        fn set_owner_delegate(&mut self, account: AccountId) -> Result<(), &'static str> {
            let caller = self.env().caller();
            let owner = self.get_owner();
            if caller != owner {
                // return Err(Error::CallerIsNotOwner)
                return Err("Error: CallerIsNotOwner")
            }
            self.owner_delegates.push(account);

            // Emit event
            self.env()
            .emit_event(
                SetOwnerDelegate {
                    account
                });

            // TODO - emit set owner event
            Ok(())
        }

        /// Private functions

        /// Get the score for an AccountId or 0 if it is not set.
        fn account_score_or_zero(&self, of: &AccountId) -> u32 {
            let score = self.account_to_score.get(of).unwrap_or(&0);
            *score
        }

        /// Get the username for an AccountId or nothing if it is not set.
        fn account_username_or_zero(&self, of: &AccountId) -> Vec<u8> {
            let blank: Vec<u8> = Vec::new();
            let username = self.account_to_username.get(of).unwrap_or(&blank);
            username.to_vec()
        }

        /// Check if AccountId is the owner
        fn is_owner(&self, of: &AccountId) -> bool {
            let owner = self.get_owner();
            if owner != *of {
                return false;
            }
            return true;
        }

        /// Check if AccountId is an owner delegate
        fn is_owner_delegate(&self, of: &AccountId) -> bool {
            let owner_delegates = self.get_owner_delegates().unwrap_or(Vec::new());
            if owner_delegates.len() == 0 {
                return false;
            }
            let mut is_owner_delegate = false;
            if owner_delegates.iter().any(|&d| d == *of) {
                is_owner_delegate = true;
            }
            is_owner_delegate
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
        fn test_get_dummy_account() -> AccountId {
            [0u8; 32].into()
        }

        /// Returns a blank username for unit tests
        fn test_get_blank_username() -> String {
            String::from("").into()
        }

        /// Returns a dummy username Alice for unit tests
        fn test_get_dummy_username_alice() -> String {
            String::from("Alice").into()
        }

        /// Returns a dummy username Bob for unit tests
        fn test_get_dummy_username_bob() -> String {
            String::from("Bob").into()
        }

        /// Returns the AccountId that that deploys the contract in the
        /// Unit Tests and so owns the contract 
        fn test_get_owner() -> AccountId {
            [1u8; 32].into()
        }

        /// Unit Test Functions

        #[test]
        fn get_score_of_account_works() {
            let leaderboard = Leaderboard::new();
            assert_eq!(leaderboard.get_score_of_account(test_get_dummy_account()), 0);
        }

        #[test]
        fn get_username_of_account_works() {
            let leaderboard = Leaderboard::new();
            assert_eq!(leaderboard.get_username_of_account(test_get_dummy_account()), test_get_blank_username());
        }

        #[test]
        fn get_score_of_sender_works() {
            let leaderboard = Leaderboard::new();
            assert_eq!(leaderboard.get_score_of_sender(), 0);
        }

        #[test]
        fn get_owner_works() {
            let mut leaderboard = Leaderboard::new();
            assert_eq!(leaderboard.get_owner(), test_get_owner());
            assert_eq!(leaderboard.set_owner(test_get_dummy_account()), Ok(()));
            assert_eq!(leaderboard.get_owner(), test_get_dummy_account());
        }

        #[test]
        fn get_owner_delegates_returns_error_when_no_owner_delegates_works() {
            let leaderboard = Leaderboard::new();
            assert_eq!(leaderboard.get_owner_delegates(), Err("Error: Unable to find any owner delegates"));
        }

        #[test]
        fn get_owner_delegates_works() {
            let mut leaderboard = Leaderboard::new();
            assert_eq!(leaderboard.set_owner_delegate(test_get_dummy_account()), Ok(()));
            assert_eq!(leaderboard.get_owner_delegates(), Ok(ink_prelude::vec!(test_get_dummy_account())));
        }

        #[test]
        fn set_score_of_sender_works() {
            let mut leaderboard = Leaderboard::new();
            assert_eq!(leaderboard.set_score_of_sender(1), Ok(()));
            assert_eq!(leaderboard.get_score_of_sender(), 1);
        }

        #[test]
        fn set_score_of_account_is_ok_when_sender_equals_given_account_works() {
            let mut leaderboard = Leaderboard::new();
            assert_eq!(leaderboard.get_owner(), test_get_owner());
            assert_eq!(leaderboard.set_score_of_account(test_get_owner(), 2), Ok(()));
            assert_eq!(leaderboard.get_score_of_account(test_get_owner()), 2);
            assert_eq!(leaderboard.get_score_of_account(test_get_dummy_account()), 0);
        }

        #[test]
        fn set_score_of_account_errors_when_sender_not_equal_given_account_works() {
            let mut leaderboard = Leaderboard::new();
            assert_eq!(leaderboard.get_owner(), test_get_owner());
            assert_eq!(leaderboard.set_score_of_account(test_get_dummy_account(), 2),
                Err("Error: CallerIsNotOwner and CallerIsNotOwnerDelegate"));
            assert_eq!(leaderboard.get_score_of_account(test_get_dummy_account()), 0);
            assert_eq!(leaderboard.get_score_of_account(test_get_owner()), 0);
        }

        #[test]
        fn set_score_of_account_is_ok_when_sender_is_owner_delegate_but_not_owner_works() {
            let mut leaderboard = Leaderboard::new();
            assert_eq!(leaderboard.get_owner(), test_get_owner());
            assert_eq!(leaderboard.set_owner_delegate(test_get_dummy_account()), Ok(()));
            assert_eq!(leaderboard.set_score_of_account(test_get_dummy_account(), 2), Ok(()));
            assert_eq!(leaderboard.get_score_of_account(test_get_dummy_account()), 2);
            assert_eq!(leaderboard.get_score_of_account(test_get_owner()), 0);
        }

        #[test]
        fn get_all_scores_works() {
            let mut leaderboard = Leaderboard::new();
            assert_eq!(leaderboard.set_score_of_account(test_get_owner(), 3), Ok(()));
            assert_eq!(leaderboard.set_owner_delegate(test_get_dummy_account()), Ok(()));
            assert_eq!(leaderboard.set_score_of_account(test_get_dummy_account(), 5), Ok(()));
            assert_eq!(leaderboard.get_all_scores(),
                Ok(ink_prelude::vec!(
                    AccountToScore (test_get_owner(), 3),
                    AccountToScore (test_get_dummy_account(), 5)
                ))
            );
        }

        #[test]
        fn get_all_usernames_works() {
            let mut leaderboard = Leaderboard::new();
            assert_eq!(leaderboard.set_username_of_account(test_get_owner(), test_get_dummy_username_alice()), Ok(()));
            assert_eq!(leaderboard.set_owner_delegate(test_get_dummy_account()), Ok(()));
            assert_eq!(leaderboard.set_username_of_account(test_get_dummy_account(), test_get_dummy_username_bob()), Ok(()));
            assert_eq!(leaderboard.get_all_usernames(),
                Ok(ink_prelude::vec!(
                    AccountToUsername (test_get_owner(), test_get_dummy_username_alice()),
                    AccountToUsername (test_get_dummy_account(), test_get_dummy_username_bob())
                ))
            );
        }

        // TODO - Add tests for Events
        // See: https://paritytech.github.io/ink/ink_core/env/test/fn.recorded_events.html
        // Pending this issue to export the necessary EmittedEvent type from ink_core
        // https://github.com/paritytech/ink/issues/468
    }
}
