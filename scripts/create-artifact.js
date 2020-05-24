'use strict';

const github = require('@actions/github');

const TOKEN = process.env.GITHUB_TOKEN,
  REF = process.env.REF;

console.log(REF, process.platform, process.arch, process.versions.modules);

const octokit = new github.GitHub(TOKEN);

const main = async () => {
  const response = await octokit.repos.listReleases({owner: 'uhop', repo: 'node-re2'});
  console.log(response);
};

main();
