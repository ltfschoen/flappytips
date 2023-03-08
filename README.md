## FlappyTips 2

**Objective:** Fly the DOT character between more gaps (of obstacles blocks) than all other opponents to win the game of that starting block on the Zeitgeist chain.

**Economics** Players may choose to play without using any funds. However, incentivises exist that require tokens, where users may create a Substrate-based account and deposit sufficient tokens (DOT tokens) to cover the transaction costs required to share their game results. If the user plays the game and shares their results, they may be eligible for a tip from the treasury.

**Build Log**
* Add restricted gameplay endpoint of only Zeitgeist to use their block time for ease of integration with the Zeitgeist prediction markets. Future releases may restore choice of chain
* Adds support for multiplayer instead of just single player games. If no other opponents connect in time. Once the user selects a Polkadot.js Extension account to play with and clicks "Play" it schedules a game at a future block. Other players may join if they also click "Play" a sufficient amount of blocks before the game starts, otherwise they are scheduled to play at a future block, where other players can join too.
* Added support to show ghost icon of other players during gameplay
* Adds support to tracks the start block and end block of the game after all players have hit an obstacle
* Adds gameplay success factor where players may only Win in multiplayer. Single player games or draws are shown as losing
* Updated all dependencies including Polkadot.js API, Polkadot Extension, Express API, P5 Gaming API, React
* Updated from Node.js 10 to latest Node.js 19 and updated Yarn 1 to Yarn 3
* Added Websockets support for multiplayer
* Add IP address recording only incase necessary to block malicious users in production.
* Retains FlappyTips 1 UI where player character is a dot icon
* Retains FlappyTips 1 gameplay movement via pressing space bar (Desktop) or tapping screen (Mobile) to fly character between gaps of approaching obstacles. Each obstacle is labelled to represent a block of the connected blockchain (Zeitgeist)
* Retains FlappyTips 1 obstacle speed increase after each obstacle bypassed
* Retains FlappyTips 1 responsive support for mobile devices or desktop
* Retains FlappyTips 1 legacy code where users may share their results on Twitter
* Retains FlappyTips 1 legacy code (only Desktop support) to request a tip from the Polkadot treasury
* Retains FlappyTips 1 support for deploying to Heroku for production
* Temporarily removes FlappTips 1 support for requesting a tip on Mobile devices until QR code scanning is supported to avoid having tn enter private key
* Removes FlappyTips 1 Namebase API and Handshake API domain deployment since Sia Skynet Skylink deprecated.

### Play

#### Setup
* Create an account at "Add Account" from Polkadot.js Apps at https://polkadot.js.org/apps/#/accounts
* Install the latest [Polkadot.js Browser Extension](https://github.com/polkadot-js/extension) and import that account
* Go to https://flappytips.herokuapp.com
* Authorize in the popup from Polkadot.js Browser Extension for FlappyTips 2 dapp to access the the addresses of your accounts by clicking "Yes, allow this application access"
* Select an injected account from Polkadot.js Browser Extension to play a game with

#### Start Game
* Click the "Play" button after the "Loading..." screen disappears to automatically schedule to play a game at an upcoming block
* Watch the countdown to the scheduled starting block when gameplay starts  
* Press space bar multiple times (Desktop) to make your dot character fly and try to navigate and clear your way through gaps in the obstacles to score points.
* Touch the screen multiple times to fly the DOT (Mobile devices)
* Obstacles (blocks) appear each time a new block is authored on the connected chain (Zeitgeist). 
* After each block appears, the speed that it moves increases each time.
* After about 10 blocks the gap may becomes larger but it still becomes more difficult as the blocks move faster

#### Share Results
* After game ends optionally click the "Share" button to share your result or request a tip (Desktop only) 
* After winning a game you may wish to click the "Share & Request Tip?" button, along with an optional identifer (i.e. your Twitter handle). Share your result on Twitter for free. Alternatively deposit submit sufficient funds into the wallet to create an extrinsic to Polkadot chain (DOT tokens) that will report your awesomeness for clearing some blocks requesting a Tip, and should appear in the "Tip" section here https://polkadot.js.org/apps/#/treasury on a chain that supports `treasury.reportAwesome` (Polkadot).

### Develop Environment

Clone the repository. Checkout the PR with FlappyTips 2 features.
```
git clone https://github.com/ltfschoen/flappytips
git fetch origin flappydot:flappydot
git checkout flappydot
```

Install Yarn 3.x and Node.js, and then run the following in terminal:
```
nvm use 19.6.0
npm i -g yarn
corepack enable && corepack prepare yarn@stable --activate && yarn set version 3.4.1 \
yarn \
npm install -g nodemon &&
npm install -g concurrently &&
yarn add node-gyp &&
yarn add fs &&
DEBUG=* yarn run dev
```
 
* Follow the "Setup" in the "Play" section of this README file, but instead go to http://localhost:4000
* Click the polkadot-js/extension browser icon and allow it to interact with FlappyTips 2
* Press space bar to make your dot character fly and try to navigate through the obstacles.
* Open other browser windows at http://localhost:4000 for other players to join
* Access the API endpoints at http://localhost:5000/api 

### Debugging on Mobile

https://www.addictivetips.com/android/get-web-console-log-chrome-for-android/

### Debugging Websockets

To enable websockets debugging in server logs: 

```
DEBUG=* node yourfile.js // server

localStorage.debug = '*'; // browser
```

https://socket.io/docs/v4/logging-and-debugging/

https://socket.io/docs/v4/client-installation/

To debug Websockets frames in browser: https://stackoverflow.com/a/30770934/3208553
It may be necessary to drag down an expand the window to view each frame.

### Maintenance

```
npm outdated
npm update --save
rm -rf node_modules
npm install
```

### Websockets Socket.IO

#### Troubleshooting

* Client & Server paths must match
  * Client
    ```
    const socketEndpoint = <ENDPOINT>;
    const socket = io(socketEndpoint, {
      transports: ["websocket"],
      addTrailingSlash: true, // trailing slash of path
      path: "/socket.io/", // explicit custom path (default)
    });
    ```

  * Server
    ```
    const io = require("socket.io")(httpServer, {
      transports: ["websocket"], // set to use websocket only
      path: "/socket.io/", // explicitely set custom path (default)
      ...
    ```

#### References

* https://www.nginx.com/blog/nginx-nodejs-websockets-socketio/
* https://www.linode.com/docs/guides/how-to-install-and-use-nginx-on-ubuntu-20-04/
* https://medium.com/@adrianhsu/node-js-nginx-https-cloudflare-server-setup-google-app-domain-8020eb0e4181

### Nginx

#### Config

* Full example /etc/nginx/nginx.conf
	* https://www.linode.com/docs/guides/getting-started-with-nginx-part-4-tls-deployment-best-practices/#full-configuration-example
* Diffie Hellman Prime https://www.linode.com/docs/guides/getting-started-with-nginx-part-4-tls-deployment-best-practices/#create-a-larger-diffie-hellman-prime
* Keepalive https://www.linode.com/docs/guides/getting-started-with-nginx-part-4-tls-deployment-best-practices/#increase-keepalive-duration
* Session Duration https://www.linode.com/docs/guides/getting-started-with-nginx-part-4-tls-deployment-best-practices/#increase-tls-session-duration
* HTTP 2 Support - https://www.linode.com/docs/guides/getting-started-with-nginx-part-4-tls-deployment-best-practices/#enable-http2-support
  * Verify HTTP 2 works https://tools.keycdn.com/http2-test
* OCSP Stapling - https://www.linode.com/docs/guides/getting-started-with-nginx-part-4-tls-deployment-best-practices/#ocsp-stapling

### HTTPS / SSL

#### Option 1: Let's Encrypt / CertBot

##### Community

https://community.letsencrypt.org/

##### Setup

* https://letsencrypt.org/getting-started/
	* Demonstrate control over website using ACME Protocol - https://tools.ietf.org/html/rfc8555
		* Use the Certbot ACME Client - https://certbot.eff.org/

* https://www.linode.com/docs/guides/enabling-https-using-certbot-with-nginx-on-ubuntu/
* Mentions use of chain.pem as intermediate certificates https://eff-certbot.readthedocs.io/en/stable/using.html#where-are-my-certificates

```
sudo apt update
sudo apt install snapd
sudo snap install core
sudo snap refresh core
sudo apt remove certbot
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

```
sudo certbot --nginx \
  -d clawbird.com \
  -d www.clawbird.com
```

* Specify email address and other details

* Output
```
$ cat /etc/letsencrypt/live/README

`[cert name]/privkey.pem`  : the private key for your certificate.
`[cert name]/fullchain.pem`: the certificate file used in most server software.
`[cert name]/chain.pem`    : used for OCSP stapling in Nginx >=1.3.7.
`[cert name]/cert.pem`     : will break many server configurations, and should not be used without reading further documentation (see link below).
```

Note: None of the certificates or keys should be pushed to Git but I have included only self-signing ones for learning purposes.

```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/www.clawbird.com/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/www.clawbird.com/privkey.pem
This certificate expires on 2023-05-20.
These files will be updated when the certificate renews.
Certbot has set up a scheduled task to automatically renew this certificate in the background.

Deploying certificate
Successfully deployed certificate for www.clawbird.com to /etc/nginx/sites-enabled/flappytips
Successfully deployed certificate for clawbird.com to /etc/nginx/sites-enabled/flappytips
Congratulations! You have successfully enabled HTTPS on https://www.clawbird.com and https://clawbird.com
```

* Verify SSL works: https://www.ssllabs.com/ssltest/analyze.html?d=clawbird.com&latest

* Renew certificate when required https://www.linode.com/docs/guides/enabling-https-using-certbot-with-nginx-on-ubuntu/

* Diffie Hellman Prime - https://www.linode.com/docs/guides/getting-started-with-nginx-part-4-tls-deployment-best-practices/#create-a-larger-diffie-hellman-prime

  ```
  cd /etc/letsencrypt/live/www.clawbird.com/
  openssl genpkey -genparam -algorithm DH -out /root/certs/clawbird.com/dhparam4096.pem -pkeyopt dh_paramgen_prime_len:4096

  mv dhparam4096.pem /root/certs/clawbird.com 
  ```

	* Add this to SSL directives 
		```
		ssl_dhparam /root/certs/clawbird.com/dhparam4096.pem;
		```

* Add to /etc/nginx/nginx.conf
  ```
	keepalive_timeout 75;
  ```

* Add to /etc/nginx/sites-available/flappytips
  ```
	ssl_session_cache shared:SSL:10m;
	ssl_session_timeout 10m;

	ssl_stapling on;
	ssl_stapling_verify on;
	ssl_trusted_certificate /etc/letsencrypt/live/www.clawbird.com/fullchain.pem;
  ```

* Add to server:
  ```
  key: fs.readFileSync(path.resolve('/etc/letsencrypt/live/www.clawbird.com/privkey.pem')),
  cert: fs.readFileSync(path.resolve('/etc/letsencrypt/live/www.clawbird.com/fullchain.pem')),
  ```

#### Option 2: PositiveSSL

PositiveSSL activation and add to server

* Namecheap Setup https://ap.www.namecheap.com/domains/ssl/productpage/1964069/
* Submit data to CA https://www.namecheap.com/support/knowledgebase/article.aspx/794/67/how-do-i-activate-an-ssl-certificate
* Confirm you control the domain https://www.namecheap.com/support/knowledgebase/article.aspx/9637/14/how-can-i-complete-the-domain-control-validation-dcv-for-my-ssl-certificate/
* CSR Generation Guide https://www.namecheap.com/support/knowledgebase/article.aspx/467/67/how-do-i-generate-a-csr-code
	* Other guides https://www.namecheap.com/support/knowledgebase/article.aspx/467/2290/how-to-generate-csr-certificate-signing-request-code/
	* Steps https://edtechchris.com/2020/02/11/generate-csr-with-openssl-on-ubuntu/
      ```
      openssl req -new -newkey rsa:2048 -nodes -keyout clawbird.com.key -out clawbird.com.csr
      <COUNTRY>
      <FULL_STATE>
      <CITY>
      <COMPANY>
      <OPTIONAL_DEPARTMENT> (i.e. IT)
      clawbird.com
      <EMAIL>
      ```

    * Enter challenge password (to be sent with certificate request)

		* The above generates the clawbird.com.key and clawbird.com.csr files
		```
		cat clawbird.com.csr
		```

		* Backup the clawbird.com.key and clawbird.com.csr files

			```
			scp root@<IP>:/var/www/flappytips/clawbird.com.csr ~/Documents
			scp root@<IP>:/var/www/flappytips/clawbird.com.key ~/Documents
			```

		* choose CNAME record for the DCV

			* Follow steps here: https://www.youtube.com/watch?v=35yC4rConu8

			* Add to Linode Domain: https://www.linode.com/docs/products/networking/dns-manager/get-started/#register-the-domain

				Domain: clawbird.com
				SOA Email Address: ___
				Insert Default Records, choose the Linode to use
				Add the same Host and Target records to a CNAME in Linode Domains with TTL of 60

			* Add Custom DNS records at Linode to Namecheap for that domain 
				* https://ap.www.namecheap.com/Domains/DomainControlPanel/clawbird.com/domain/

				ns1.linode.com
				ns2.linode.com
				ns3.linode.com
				ns4.linode.com
				ns5.linode.com

		* Verify at https://mxtoolbox.com/SuperTool.aspx?action=cname%3aclawbird.com&run=toolpage

		* Wait for https://ap.www.namecheap.com/domains/ssl/productpage/1964069/clawbird.com/dashboard to stop displaying "PENDING", then check email for the SSL certificates

    * Copy certs into /root/certs/clawbird.com
      ```
      mkdir -p /root/certs/clawbird.com

      cp /var/www/flappytips/clawbird.com.csr /root/certs/clawbird.com/positivessl
      cp /var/www/flappytips/clawbird.com.key /root/certs/clawbird.com/positivessl
      ```

    * When get certificate, download it, extract it, and copy it to server

      ```
      mv clawbird_com.crt clawbird.com.crt
      mv clawbird_com.ca-bundle clawbird.com.ca-bundle
      scp ~/Documents/clawbird_com/clawbird.com.crt root@<IP_ADDRESS>:/root/certs/clawbird.com/positivessl
      scp ~/Documents/clawbird_com/clawbird_com.ca-bundle root@<IP_ADDRESS>:/root/certs/clawbird.com/positivessl
      clawbird.com.ca-bundle
      ```

    * Combine the .ca-bundle with the .crt file https://www.namecheap.com/support/knowledgebase/article.aspx/9419/33/installing-an-ssl-certificate-on-nginx/

      ```
      cat clawbird.com.crt > your_domain_chain.crt ; echo >> your_domain_chain.crt ; cat clawbird_com.ca-bundle >> your_domain_chain.crt

      mv your_domain_chain.crt clawbird.com.combined.crt
      ```

		* Check if SSL is working https://decoder.link/


    * Lastly, update all Nginx config files, and update server.js with the link to the new certificate, then kill the old server on port 5000, re-enter the `screen -ls` rebuild with `yarn && yarn run start`, detach screen, and restart Nginx

#### Backup Certificates

* Backup SSL files
	```
	mkdir -p /root/certs/backup
	cp /etc/nginx/nginx.conf /root/certs/backup/nginx.conf.backup-pt1
  	cp -r /etc/nginx/conf.d/ /root/certs/backup/conf.d-backup-pt1
  	cp /etc/nginx/sites-available/flappytips /root/certs/backup/flappytips-backup-pt1
	```

### Content Security Policy (CSP)

https://content-security-policy.com/

* Add to /etc/nginx/nginx.conf
```
add_header          Content-Security-Policy "default-src 'self' 'unsafe-eval'; upgrade-insecure-requests; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-eval' platform.twitter.com syndication.twitter.com; script-src-elem 'self' https://platform.twitter.com/widgets.js https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.0.0/p5.js https://clawbird.com:4000/static/js/main.1d765367.js https://clawbird.com/static/js/main.1d765367.js https://platform.twitter.com/js/button.e7f9415a2e000feaab02c86dd5802747.js; connect-src 'self' platform.twitter.com syndication.twitter.com wss://rpc.polkadot.io/ https://ipapi.co/json/ wss://clawbird.com:443/socket.io/ wss://clawbird.com:5000/socket.io/ wss://zeitgeist-rpc.dwellir.com/ https://clawbird.com:4000/assets/LemonMilkMedium.otf https://clawbird.com/assets/LemonMilkMedium.otf; img-src 'self' data: https://clawbird.com:4000/favicon.ico https://clawbird.com/favicon.ico https://clawbird.com:4000/logo192.png https://clawbird.com/logo192.png platform.twitter.com syndication.twitter.com; frame-src 'self' https://platform.twitter.com/";
```

### Deploy to Linode

Deploy React App with Linode https://www.youtube.com/watch?v=FTyby51m0hQ

```
ssh x@x.x.x.x
git clone git@github.com:ltfschoen/flappytips.git
git fetch origin master
git checkout master
```

* Check that HTTPS and WWS example credentials that were setup using this guide are still valid guidehttps://medium.com/developer-rants/implementing-https-and-wss-support-in-express-with-typescript-of-course-f36006c77bab
```
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365
openssl rsa -in key.pem -out key-rsa.pem
```
  * Ngrok to use https and forward to non-https dev server https://camerondwyer.com/2019/09/23/using-ngrok-to-get-a-public-https-address-for-a-local-server-already-serving-https-for-free/

* Install NVM https://www.linode.com/docs/guides/how-to-install-use-node-version-manager-nvm/

* Install Nginx (default latest from apt is 1.18)
```
nvm use v19.6.0
apt-get update && apt-get upgrade
sudo apt install nginx

mv ./flappytips /var/www/flappytips
sudo vim /etc/nginx/nginx.conf
sudo vim /etc/nginx/sites-available/flappytips
sudo ln -s /etc/nginx/sites-available/flappytips /etc/nginx/sites-enabled
sudo nginx -t
nginx -s reload && sudo systemctl restart nginx
journalctl -xeu nginx.service
```

  * Show Nginx version installed
    ```
    apt-get update && apt-get upgrade
    apt install nginx

    nginx is already the newest version (1.18.0-6ubuntu14.3)
    ```

* Update from Nginx 1.18 to Nginx 1.23.3. Note that at https://nginx.org/en/download.html it shows 1.23 (mainline version) and 1.18 (legacy), but installing using `apt` only installs 1.18.
  * Important: Backup /etc/nginx/nginx.conf first since it will be overwritten

  * Temporarily disable Nginx
    ```
    ps -auxww | grep nginx
    sudo systemctl status nginx
    sudo systemctl stop nginx
    sudo systemctl disable nginx
    ```
  * Run the commands here https://nginx.org/en/linux_packages.html#Ubuntu
  * Restore functionality of /etc/nginx/nginx.conf by adding lines like the following that were removed linking to the site in /etc/nginx/sites-available/flappytips
    ```
    include /etc/nginx/modules-enabled/*.conf;
    ...
    add_header          Content-Security-Policy "default-src 'self'; upgrade-insecure-requests;";
    ...
    include /etc/nginx/sites-enabled/*;
    ```
  * Verify version
    ```
    nginx -V

    nginx version: nginx/1.23.3
    ```
  * Restart Nginx and reload config files
    ```
    sudo systemctl stop nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
    sudo systemctl reload nginx
    nginx -s reload
    sudo systemctl status nginx
    ```
    * Alternatives
      ```
      sudo systemctl restart nginx
      sudo service nginx reload
      sudo service nginx status
      ```

* https://www.linode.com/docs/guides/getting-started-with-nginx-part-3-enable-tls-for-https/

/etc/nginx/sites-available/flappytips
```
server {
  # Self-signed certificate
  # ssl_certificate     /var/www/flappytips/cert.pem;
  # ssl_certificate_key /var/www/flappytips/key-rsa.pem;

  listen          443 ssl default_server;
  listen          [::]:443 ssl default_server;
  server_name     139.144.96.196;
  root            /var/www/flappytips/build;
  index           index.html;
  location / {
                  try_files $uri /index.html =404;
  }
}
```

* Run web server using screen (`apt install screen`) 
  * https://phoenixnap.com/kb/how-to-use-linux-screen-with-commands
  * https://www.geeksforgeeks.org/screen-command-in-linux-with-examples/
  * Setup .env file for production
    ```
    . ./scripts/env-prod.sh
    ```
    * Note: Must be sourced to set variables in calling environment
  * Start screen `screen -S flappytips`
  * Show screens `screen -ls`
  * Create screen if not exist CTRL-A + C
  * Attach to existing screen `screen -r <ID>`
  * Detach from existing screen without losing it CTRL-A + D

* Run after changing source code or Nginx configuration files:
```
nginx -s reload && sudo systemctl restart nginx
```

* Enable Firewall
```
ufw enable
ufw status verbose
ufw allow 'Nginx Full'
ufw reload
```

* Follow development environment commands

* Run with screen https://linuxconfig.org/how-to-run-command-in-background-on-linux

### Linode Troubleshooting

If error address in use EADDRINUSE when try to restart server
```
lsof -i tcp:5000

kill -9 <PID>
```

### Deploy to Heroku

Note: It is necessary to use either Eco or Basic plan on Heroku. [Eco plan dyno that receives no web traffic in a 30-minute period sleeps and becomes active again upon receiving traffic](https://devcenter.heroku.com/articles/eco-dyno-hours#dyno-sleeping). See https://www.heroku.com/pricing

Note:  I tried to deploy and run the game on Heroku after removing console.log to reduce the required production memory to ~1Gb memory. I provided credit card info and chose 1 dyno resized to performance-m which has 2.5Gb memory instead of 0.5Gb memory of the lower plans that were giving R14 out of memory errors, however Heroku would not let me scale to performance-m and an gave an error `Access to performance-m and performance-l dynos is limited to customers with an established payment history`. But the only way to quickly get payment history is to buy their lame $5 Eco plan that only provides 0.5Gb of memory, which is not sufficient to run my game anyway, but they do not give the option of paying $25 upfront for the performance-m plan.
```
[heroku-exec] Starting
2023-02-17T09:08:44.912127+00:00 app[web.1]: Creating an optimized production build...
2023-02-17T09:09:00.375813+00:00 heroku[web.1]: Process running mem=789M(154.3%)
2023-02-17T09:09:00.377211+00:00 heroku[web.1]: Error R14 (Memory quota exceeded)
2023-02-17T09:09:22.552936+00:00 heroku[web.1]: Process running mem=1194M(233.2%)
2023-02-17T09:09:22.555218+00:00 heroku[web.1]: Error R15 (Memory quota vastly exceeded)
2023-02-17T09:09:22.557134+00:00 heroku[web.1]: Stopping process with SIGKILL
```
So despite having used Heroku for many years with Ruby on Rails, based on this experience I think I will switch to deploying on Linode where I already have a cheap server with plenty of memory. 

* Install Heroku CLI for macOS
```
brew tap heroku/brew && brew install heroku
```

* Start
```
heroku login
heroku apps:create flappytips
heroku git:remote -a flappytips
heroku config:set XYZ=abc --app flappytips
git push -f heroku yourbranch:master
git push -f heroku master
heroku local web
heroku ps:scale web=0:Eco
heroku ps
heroku open
heroku logs --tail
heroku restart
```

* SSH
```
heroku ps:exec
```

* Stop
```
heroku ps:stop web
```

* Scale up dynos. If you get an error like `code=H14 desc="No web processes running"` in Heroku logs then scale your dynos
```
heroku ps:scale web=1:Basic
heroku ps:scale web=2:standard-2x
heroku ps:scale web=1:performance-m
```

* Scale down dynos
```
heroku ps:scale web=0:Eco
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

#### Zeitgeist Prediction Markets Integration

##### Create Market

Note: Relevant Zeitgeist frontend UI code to create a market https://github.com/zeitgeistpm/ui/blob/staging/pages/create.tsx

* User enters market name
* User enters question
* User adds logo for market
* User choose category (i.e. e-sports)
* User chooses market end date or block (when game ends)
	- Calculate time lapsed between current zeitgeist block and proposed market end block
	- Ensure it ends after get result from all competitors, than allow time for oracle result too
	- Zeitgeist app provides 4 days for oracle to submit final outcome (otherwise oracle forfeits oracle bond of 200 ZTG)
	(i.e. >= 4 days between market ending and oracle submitting result)
* User creates crypto assets for each outcome, i.e. Y/N, Options, Range
	i.e. outcomes + ticker Player1 PLY1, Player2 PLY2 (ticker must be unique)
	- The more outcome tokens minted (i.e. amt column below... the better for the market, and the more efficient the market will be
* User specifies Oracle wallet address
	i.e. use your own i.e. d_______ (Zeitgeist)
	- Must report the correct result before resolution time
* User specifies market description
	- The end date
	- Location of source of finality
	- i.e. Prediction market to give insights into who will win the ___ race,
	the market will end right before the semi-final stage so to give more opportunity for predictions,
	the Oracle shall source the result from url www.___.com after the final completes,
	in the highlight unlikely even that it is a draw, then the outcome "OTHER" shall be the winning token,
	winners holding a winning asset get 1 ZTG per winning asset 
* User gets liquidity from zeitgeist or provides it themselves

balance    weights  %	amt price (1 ZTG / 3)	total value
PLY1 200      33       33	100      0.33				33
PLY2 200      33       33	100      0.33				33
PLY3 200	    33       33	100      0.33				33
ZTG  200	    100	     100 100     1          100

Note: markets denominated in ZTG tokens (to buy/sell outcome assets)

Prize pool = 100 ZTG
Liquidity  = 200 ZTG

* User chooses Pool Fees (i.e. 0.1%, 1%, 10%, 3%) allowing liquidity providers to collect more from a given trade, but may reduce market participants

Cost breakdown
Network fee             - 0.053 ZTG
Permissionless Bond 	  - 1000 ZTG (if believe it is a fair market, returned if market not deleted by committee)
Oracle Bond 			      - 200 ZTG
Liquidity				        - 200 ZTG (100 for counterpair, 10*10=100 to mint other outcome tokens)
* Ends in x days

### Oracle Smart Contract in ink!

#### Setup & Deploy

* Install Rust
* Check version
```
rustup update
rustup show
```
* Install Cargo Contract to allow you to compile and interact with contracts (published on crates.io)
```
cargo install cargo-contract --version 2.0.0-rc.1
```
  * Error (see Github Issues)

* Run Cargo Contract Node
```
substrate-contracts-node --dev
```

* Install Contracts Node
```
cargo install contracts-node --git https://github.com/paritytech/substrate-contracts-node/ --version 0.24.0
```

* Create rust project with template inside (i.e. Cargo.toml and lib.rs, which uses ink crate 4.0.0-rc)
	```
  cargo contract new flappytips
  ```
* Generate .contract, .wasm, metadata.json code. Note: Use `---release` to deploy
	```
  cargo contract build
	cargo contract build --release
  ```

* Upload Contract (note: prefer to use contracts-ui to avoid exposing private key)
```
cargo contract upload --suri //Alice
```

* Outputs the:
```
CodeStored event
code_hash: 0x......
```
  * Note: only one copy of the code is stored, but there can be many instance of one code blob,
differs from other EVM chains where each node has a copy

#### Interact with ink! Contracts using Contracts Node

##### Cargo Contracts

* Instantiate Contract
```
contract instantiate \
	--suri //Bob \
	--contructor new \
	--args 10
```

* Wait for response

```
...
Event System => NewAccount
	account: 5G...
...
Event Contracts + Instantiated
	deployer: 5F...
	contract: 5G.... (new contract account address to interact with contract)
...
```

* Check value was assigned correctly
* Use `dry-run` because if execute as a transaction then we won't see the return value
```
cargo contract call \
	--suri //Charlie \
	--contract 5G... \
	--message get \
	--dry-run
```

* Interact to increment by 5, not a dry run so no response but we get a gas limit response

```
cargo contract call \
	--suri //Charlie \
	--contract 5G... \
	--message inc \
	--args 5
```

* Check it incremented

```
cargo contract call \
	--suri //Charlie \
	--contract 5G... \
	--message get \
	--dry-run
```

* Note: only works in debug mode `cargo build` (not release)
```
ink::env::debug_println("inc by {}, new value {}", by, self.value);
```

* Note: it should output on substrate-contracts-node too as `tokio-runtime-worker runtime::contracts Exection finished with debug buffer...`
* Note: it should show in contracts-ui website too
* Note: events are not emitted in a dry-run (why wouldn't we want this in debugging mode?)

#### Interact with Contract using Polkadot.js API

* Reference https://polkadot.js.org/docs/api-contract/start/basics

<!--
## Smart Contracts

### Create Leaderboard using Substrate ink! Smart Contract language

* Install Substrate, WASM, latest Substrate node client with built-in Contracts module, ink! CLI.
See https://substrate.dev/substrate-contracts-workshop/#/0/setup
```
curl https://getsubstrate.io -sSf | bash -s -- --fast
rustup target add wasm32-unknown-unknown --toolchain stable
rustup component add rust-src --toolchain nightly
cargo install node-cli --git https://github.com/paritytech/substrate.git --tag v2.0.0-rc4 --force
cargo install cargo-contract --vers 0.6.1 --force
```

* Generate boilerplate Flipper smart contract.
See https://substrate.dev/substrate-contracts-workshop/#/0/creating-an-ink-project
```
mkdir -p ink/contracts
cd ink/contracts
cargo contract new flipper
cd flipper
```

* Build smart contract to convert ink! project into Wasm binary for deployment to chain.
Access in ./target/<CONTRACT_NAME>.wasm
```
cargo +nightly build
```

* Test smart contract
```
cd ink/contracts/leaderboard
cargo +nightly test
```

* Generate smart contract metadata (ABI).
Access in ./target/<CONTRACT_NAME>.json
```
cargo +nightly contract generate-metadata
```
-->

<!-- ### Deploy Smart Contract to Edgeware

* Deploy smart contract to Substrate node. See https://substrate.dev/substrate-contracts-workshop/#/0/deploying-your-contract
  * Contract deployment is split into: 1. Deploying code on blockchain (only once); 2. Create smart contract instance; 3. Instantiate multiple times (without having to redeploy code and waste space on blockchain)
  * Go to https://polkadot.js.org/apps/#/settings.
  * Change remote node to Edgeware and "Save"
  * Go to https://polkadot.js.org/apps/#/contracts/code.
  * Click "Upload WASM" to open popup
  * Select a "deployment account" with account balance (e.g. Alice)
  * Select the generated flipper.wasm file in "compiled contract WASM" 
  * Select the generated flipper.json file in "contract ABI"
  * Click "Upload" and "Sign & Submit" (with sufficient gas to execute the contract call)
* Instantiate Contract. See https://substrate.dev/substrate-contracts-workshop/#/0/deploying-your-contract?id=creating-an-instance-of-your-contract
  * Go to https://polkadot.js.org/apps/#/contracts/code
  * Click "Deploy" for flipper.wasm
    * Give the contract account an endowment of 10 Units to pay storage rent
    * Set the maximum gas allowed to value 1,000,000
  * Note: Contract creation involves creation of a new Account.
  Give the contract account at least the existential deposit defined by the blockchain.
  Ensure contract balance is refilled with sufficient balance to pay the contract's rent (endowment)
  otherwise the contract becomes an invalid tombstone.
* Call smart contract using Polkadot.js Apps. See https://substrate.dev/substrate-contracts-workshop/#/0/calling-your-contract
  * Deploy Contract -->

### Documentation for ink!

https://paritytech.github.io/ink/

### References (Blockchain)

* Polkadot Europe Opening Ceremony - https://www.youtube.com/watch?v=Wyd1-9EIq4I
  * Hackathon website - https://www.polkadotglobalseries.com/
  * Discord - https://discord.com/channels/1047373734295646240/1052894365531525131/threads/1069922083414495252
* P5.js game using websockets - https://medium.com/geekculture/multiplayer-interaction-with-p5js-f04909e13b87
* Swanky CLI for ink! https://www.youtube.com/watch?v=rx9B6vQLmS8
  * https://github.com/ltfschoen/swanky-cli
* Substrate Contracts Tutorial ink! - https://www.youtube.com/watch?v=eUbuDey8Mog
* iMovie presentation - https://support.apple.com/en-gb/guide/imovie/mov91a895a64/mac
* ink! Resources
  * aWASoMe ink! - https://github.com/AstarNetwork/aWASoMe
  * ink! Examples https://github.com/paritytech/ink/tree/master/examples
    * Astar DAO Governer - https://github.com/AstarNetwork/wasm-showcase-dapps/blob/main/dao/governor/lib.rs
  * Leaderboard example https://github.com/OpenEmojiBattler/open-emoji-battler/tree/main/front/src/components/pages/Leaderboard
  * ink! website https://use.ink/
  * Substrate Contracts UI - https://contracts-ui.substrate.io/
  * Awesome !ink - https://github.com/paritytech/awesome-ink
  * Solidity to ink! https://github.com/727-Ventures/sol2ink
  * Old
    * Substrate Contracts Workshop https://substrate.dev/substrate-contracts-workshop/#/0/setup
* Polkadot
  * PSP - https://github.com/w3f/PSPs
* Polkadot.js
  * Zeitgeist
    * Website - https://zeitgeist.pm/ 
    * Create Market https://github.com/zeitgeistpm/ui/blob/staging/pages/create.tsx
    * ReportOutcome 
      * https://github.com/Whisker17/sdk-demo/blob/main/src/market/reportOutcome.ts
      * https://docs.zeitgeist.pm/docs/build/sdk/market#reportoutcome
    * Blog usage https://blog.zeitgeist.pm/how-to-use-zeitgeist/
* Phala Phat Contract Oracle Workshop https://github.com/Phala-Network/phat-offchain-rollup/blob/main/phat/Sub0-Workshop.md#phat-contract-oracle-workshop
* OpenEmojiBattler Substrate ink! Rust Blockchain Game - https://github.com/OpenEmojiBattler/open-emoji-battler
* Astar
  * Developers https://astar.network/developers/
  * Docs https://docs.astar.network/
    * XCM - https://docs.astar.network/docs/xcm/building-with-xcm/native-transactions/
  * Mint WASM NFTs with ink! - https://www.crowdcast.io/c/astar-tech-talk-006-wasm-nfts
* Substrate
  * Zombienet https://github.com/paritytech/zombienet
  * Substrate Connect
    * https://docs.substrate.io/fundamentals/light-clients-in-substrate-connect/
    * https://paritytech.github.io/substrate-connect/api/
    * https://substrate.io/developers/substrate-connect/
    * https://github.com/paritytech/substrate-connect
* Dev tools
  * Cheaper cloud development https://medium.com/commonwealth-labs/build-substrate-in-few-minutes-with-fraction-costs-26fce6aa5066

### Events
  * Dotsocial event - https://www.eventbrite.com/e/dotsocial-paris-tickets-516475230317?aff=AHBlogpost
  * Moonbeam Accelerator https://moonbeamaccelerator.com/
