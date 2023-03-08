server {
    listen 80;
    # required to support IPv6 so redirect works in Chrome not just Firefox
    listen [::]:80;
    server_name www.clawbird.com clawbird.com;
    # use $host instead of $server_name to include subdomains
    # use 307 for Temp redirect, 308 for Perm redirect
    # reference: https://serverfault.com/a/706439/993459
    # reference: https://serverfault.com/a/956197/993459
    return 308 https://$host$request_uri;
}

# map $http_upgrade $connection_upgrade {
#     default upgrade;
#     ''      close;
# }

# TODO - move into http{} configuration block of nginx.conf
# Upstream Declaration
# upstream appserver {
#     server 0.0.0.0:5000 weight=100; # appserver_ip:ws_port
# }

# Virtual Host Configuration
server {
    # ssl_certificate /root/certs/clawbird.com/positivessl/clawbird.com.combined.crt;
    # ssl_certificate_key /root/certs/clawbird.com/positivessl/clawbird.com.key;
    ssl_certificate /etc/letsencrypt/live/www.clawbird.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.clawbird.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

    # ssl_dhparam /root/certs/clawbird.com/dhparam4096.pem;
    # ssl_session_cache shared:SSL:1m; # 10m is default
    # ssl_session_timeout 1m; # 10m is default
    # ssl_stapling on;
    # ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/www.clawbird.com/fullchain.pem;
    # ssl_trusted_certificate /root/certs/clawbird.com/positivessl/clawbird.com.combined.crt;
    listen                  443 ssl; #default_server; # http2
    listen                  [::]:443 ssl; # default_server; # http2
    server_name             www.clawbird.com clawbird.com; # managed by Certbot
    root                    /var/www/flappytips/build;
    index                   index.html;
    # Only forward the Socket.IO requests to path /socket.io/
    # location /socket.io/ {
                            # try_files $uri /index.html =404;
                            # https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_ssl_verify
                            # proxy_set_header        Host $host;
                            # proxy_set_header        Host $http_host;
                            # proxy_set_header        Host $host:$proxy_port;
                            # proxy_set_header        X-Real-IP $remote_addr;
                            # proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
                            # proxy_set_header        X-Forwarded-Proto $scheme;
                            # proxy_set_header        X-Forwarded-Proto https;
                            # prevent header from being passed
                            # proxy_set_header        Accept-Encoding "";

                            # proxy_socket_keepalive on;
                            # proxy_ssl_server_name on;
                            # proxy_ssl_certificate /etc/letsencrypt/live/www.clawbird.com/chain.pem;
                            # proxy_ssl_certificate_key /etc/letsencrypt/live/www.clawbird.com/privkey.pem;
                            # proxy_ssl_trusted_certificate /etc/letsencrypt/live/www.clawbird.com/chain.pem;
                            # proxy_ssl_verify      on;
                                    
                            # Fix the “It appears that your reverse proxy set up is broken" error.
                            # use port where application runs below
                            # proxy_bind           127.0.0.1;
                            # proxy_pass          http://139.144.96.196:5000;
                            
                            # proxy_pass https://appserver;
                            #proxy_pass           https://0.0.0.0:5000;
                            
                            # proxy_read_timeout  90;

                            # WebSocket support
                            # proxy_http_version 1.1;
                            # proxy_set_header Upgrade $http_upgrade;
                            # proxy_set_header Connection "upgrade";
                            # proxy_set_header Connection $connection_upgrade;
    # }
}
