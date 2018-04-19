//./geth --datadir eth_data --networkid 123 --rpc --verbosity 1 console --mine --minerthreads 1 --rpcapi="personal, admin"
var Web3 = require('web3');
var mongodb = require('mongodb');
var express = require('express');

var app = express();
app.set('view engine', 'pug');
app.use(express.static('public'));

var urlMongo = "mongodb://127.0.0.1:27017/";
var urlBlockchain = 'http://127.0.0.1:8545';
var mongoClient = mongodb.MongoClient;
var	web3 = new Web3();
web3.setProvider(new Web3.providers.HttpProvider(urlBlockchain));

var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

app.get('/', function (req, res) {
  res.render('index', { title: 'Hey', message: 'Hello there!' })
})

app.listen(8080, function () {
  console.log('Example app listening on port 8080!');
});

time = setInterval(function(){
	var coinbase = web3.eth.coinbase;
	var balance = web3.eth.getBalance(coinbase);
	var balance1 = web3.eth.getBalance(web3.eth.accounts[1]);
	mongoClient.connect(urlMongo, function(err, client) {
		if(err) {
			Console.log("Impossible de se connecter à mongoDB.Erreur:", err);
		} else {
			var db = client.db('blockchaine');
			console.log("connection OK");
			var collection = db.collection('balance');
			web3.eth.accounts.forEach(function(account){
				balance1 = web3.eth.getBalance(account);
				var user1 = {
					name: account,
					balance: balance1.toString(10),
					date : new Date()
				};
				db.collection('balance').insert(user1, function(err, result) {
					if(err){
						console.log(err);
					} else {
						console.log(user1, "done");
					}
				});
			});
			client.close();
		}
	});
}, 30000);

app.get('/balance', function(req, res) {
	mongoClient.connect(urlMongo, function(err, client) {
		if(err) {
			console.log("Impossible de se connecter à mongoDB.Erreur:", err);
			res.send("Impossible de se connecter à mongoDB.Erreur:", err);
		} else {
			var db = client.db('blockchaine');
			console.log("connection OK");
			var limit = web3.eth.accounts.length;
			var collection = db.collection('balance').find().sort('date',-1).limit(limit).toArray(function(err, docs) {
				// console.log(docs);
				if(docs){
					res.render('balance', { title: 'Balance', docs: docs });
				}else{
					res.render('index', { title: 'Error', message: "Pas de données" });
				}
			});	
			client.close();
		}
	});
});

app.post('/send', function(req, res){
	console.log(req.body);
	// recuperation/decoupage de la request
	var name = req.body.name;
	var address = req.body.address;
	var amount = req.body.mount;
	var pw = req.body.password;
	var pw2 = req.body.confirmPassword;
	
	// verification de mdp+confirm mdp
	if(pw == pw2){
		// unlock le compte
		var unlock = web3.personal.unlockAccount(name,pw);
		if(unlock){
			// TODO créé la transactions vers l'address avec le montant
			web3.eth.sendTransaction({from:name, to:address, value:web3.toWei(amount, 'ether')})
		}
	}
	
	res.render('index', { title: 'OK', message: "Transaction OK" });
});
