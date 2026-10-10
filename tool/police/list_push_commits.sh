#!/bin/sh
# Print SHAs of this push, oldest first. New branches use the default branch as base.
set -eu
before="$1"
after="$2"
base="$3"
if [ "$before" = "0000000000000000000000000000000000000000" ]; then
  git rev-list --reverse "${base}..${after}"
else
  git rev-list --reverse "${before}..${after}"
fi
