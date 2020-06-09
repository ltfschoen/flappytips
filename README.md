## Flappy tips

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

* To kill a frozen process
```
ps -ef | grep node
kill -9 <PROCESS_ID>
```

## Additional Notes

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).
Credit to this repo that was used to replicate a Flappy Bird like game https://codepen.io/renzo/pen/GXWbEq
