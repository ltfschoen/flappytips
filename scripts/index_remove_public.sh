#!/bin/bash
cp ./public/index.html ./public/index-temp.html

# Replace text `%PUBLIC_URL%/` with just `/`
sed -e 's/%PUBLIC_URL%\///g' ./public/index-temp.html > ./public/index.html 
