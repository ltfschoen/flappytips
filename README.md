## Flappy tips

**Objective:** Fly the DOT character between the gaps as many blocks as possible. 

**Features**:
* Choice of currently supported chains (i.e. Polkadot, Kusama).
* Player character is a DOT (similar to Flappy Bird)
* Responsive with support for mobile devices or desktop
* Press Spacebar multiple times to fly the DOT on desktop
* Touch the screen multiple times to fly the DOT on mobile devices
* Blocks appear each time a new block is authored on your chosen chain. The chain must support `treasury.reportAwesome`
* After each block appears, the speed that it moves increases each time.
* After about 10 blocks the gap may becomes larger but it still becomes more difficult as the blocks move faster
* If you click "Share your awesomeness?" button after each game and enter your "Mnemonic Seed" that corresponds to the chain that you chose to connected to in the game, along with an optional identifer (i.e. your Twitter handle), it then will submit an extrinsic to the chain that will report your awesomeness for clearing some blocks as a Tip, and should appear in the "Tip" section here https://polkadot.js.org/apps/#/treasury. To obtain an account for that chain and an associated "Mnemonic Seed", go to https://polkadot.js.org/apps/#/accounts and create an account at "Add Account", and remember and use the "Mnemonic Seed".

### Play

* Go to https://flappytips.herokuapp.com
* Press space bar to make your dot fly and try to navigate through the obstacles.

### Develop Environment

Clone the repository, install Yarn and Node.js, and then run the following in terminal:
```
npm install -g nodemon &&
yarn &&
yarn run build &&
yarn run start-dev
```

* Go to http://localhost:3000
* Press space bar to make your dot fly and try to navigate through the obstacles.

Additional planned functionality and deployment to production is dependent on whether help is obtained from Riot channels in response to technical support enquiries.

### Deploy to Heroku

* Start
```
heroku login
heroku apps:create flappytips
git push -f heroku master
heroku local web
heroku ps:scale web=1:free
heroku ps
heroku open
heroku logs --tail
heroku restart
```

* Stop
```
heroku ps:stop web
```

* Scale up dynos
```
heroku ps:scale web=2:standard-2x
```

* Scale down dynos
```
heroku ps:scale web=1:free
```

* Fees - https://devcenter.heroku.com/articles/usage-and-billing
* Scaling help - https://devcenter.heroku.com/articles/scaling

## Troubleshooting

* If you get an unknown type error, then it may be necessary to update polkadot-js/api dependency in package.json, since it is constantly evolving.

* To kill a frozen process
```
ps -ef | grep node
kill -9 <PROCESS_ID>
```

## Additional Notes

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).
Credit to this repo that was used to replicate a Flappy Bird like game https://codepen.io/renzo/pen/GXWbEq
