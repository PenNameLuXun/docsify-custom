import { create } from 'browser-sync';
import { devConfig, prodConfig,devOrgConfig } from './server.configs.js';


function isLocal(c){
    return (c === devConfig||c === devOrgConfig)
}

function getConfig(arg){
    if(arg.includes('--devOrg')){
        return devOrgConfig
    }
    return arg.includes('--dev') ? devConfig : prodConfig
}

const bsServer = create();
const args = process.argv.slice(2);

const config = getConfig(args);

const configName = isLocal(config) ? 'development' : 'production';
const isWatch = Boolean(config.files) && config.watch !== false;
const urlType = isLocal(config) ? 'local' : 'CDN';

// prettier-ignore
console.log(`\nStarting ${configName} server (${urlType} URLs, watch: ${isWatch})\n`);

bsServer.init(config);
