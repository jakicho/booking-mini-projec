const HDWalletProvider = require("truffle-hdwallet-provider");
require('dotenv').config();
module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*" // Match any network id
    },
    rinkeby: {
      host: "127.0.0.1",
      port: 8545,
      network_id: 4,
      gas: 4700000
    },
    ropsten: {
     provider: function () {
         //return new HDWalletProvider('thank blossom little dad cry solve color material fruit cram burst dove', "https://ropsten.infura.io/v3/273e9c3b9e21438d8831fea877f0b2f4");
         return new HDWalletProvider(process.env.MNEMONIC, "https://ropsten.infura.io/v3/" + process.env.INFURA_API_KEY);
     },
     network_id: 3,
     gas: 4500000,
     gasPrice: 10000000000
    }
  }
};
