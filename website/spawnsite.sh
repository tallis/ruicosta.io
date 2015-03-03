#!/bin/bash
sudo forever -o out.log -e err.log start app.js 8080;
echo 'Ruicosta.io spawned and logging to out.log and err.log. Access reverse proxied by nginx'