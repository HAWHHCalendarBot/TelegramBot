#!/bin/bash

function pull {
  echo "pull $1"
  rsync -acv --delete-delay sk1m.de:/srv/calendarbot/$1/ $1/ | grep -E '^deleting|[^/]$|^$'
}

pull eventfiles

mkdir -p tmp
mkdir -p userconfig
