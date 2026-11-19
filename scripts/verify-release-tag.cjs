'use strict';
const {version}=require('../package.json');
const expected=`v${version}`;
if(process.env.RELEASE_TAG!==expected){
 console.error(`Release tag must exactly match package.json: expected ${expected}. No package will be published.`);
 process.exitCode=1;
}
