#!/bin/bash
cp ./build/index.html ./build/index-temp.html

# Replace text `%PUBLIC_URL%/` with just `/`
sed -e 's/\/static/static/g' ./build/index-temp.html > ./build/index.html 
