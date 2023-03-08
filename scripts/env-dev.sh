#!/usr/bin/env bash
set -e

# Change to project root directory regardless of what folder called from
# even if called from a symlink
cd $(dirname "$(dirname "$(realpath "${BASH_SOURCE[0]}")")")

cp .env.development .env
# Remove env variables in .env file from environment
# https://stackoverflow.com/a/20909045/3208553
unset $(grep -v '^#' .env | sed -E 's/(.*)=.*/\1/' | xargs)
# Add them to environment again
export $(grep -v '^#' .env | xargs -d '\n')

npx browserslist --update-db
