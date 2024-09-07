#!/bin/bash

mkdir -p /tmp/downloads

GIT_REV=$REVISION_ID
if [ -z ${GIT_REV} ];
then
  GIT_REV=$CODEBUILD_RESOLVED_SOURCE_VERSION
  if [ -z ${GIT_REV} ];
  then
    GIT_REV=`git show -s --format='%H'`
  fi
fi
echo 'export const packageGitSha1 = "'$GIT_REV'";' > src/PackageInfo.ts
