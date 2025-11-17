#!/usr/bin/env bash
set -e

# assumes other repos were cloned next to this repo (and executed)
ln -rfs ../eventfiles .
ln -rfs ../mensa-data .

mkdir -p userconfig
