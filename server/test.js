const sveltedoc = require('sveltedoc-parser');
const options = {
    filename: '/home/moe/source/Energi-Smart-Contract-Tutorial/svelte-faucet/node_modules/framework7-svelte/framework7-svelte.esm.js',
    version: 3,
    ignoredVisibilities: [],
};

sveltedoc.parse(options)
    .then(componentDoc => {
        console.log(componentDoc);
    })
    .catch(e => {
        console.error(e);
    });
