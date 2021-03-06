'use strict';

var http = require('http'),
express = require('express'),
ejs =require('ejs'),
process = require('process'),
env = process.env.NODE_ENV || 'dev',
config = require('./config')[env],
path = require('path'),
pg = require("pg"),
request = require('request');



var app = module.exports = express();

app.use(express.cookieParser());
app.use(express.session({secret: '1234567890QWERTY'}));

// all environments
app.set('port', process.env.PORT || 5000);
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(__dirname + '/static/'));


app.engine('html', ejs.renderFile);
app.set('view engine', 'ejs');  






/**
* Render the login page.
*/
app.get('/',  function index(request, response) {

	response.render('index.html');
});

app.post('/login',  function login(request, response) {

	//console.log('psurl'+config.dburl);	
	var usrname=request.body.username;
	var pass =request.body.password;

	pg.connect(config.dburl, function(err, client) {
		if(err){
			console.log('Error in connect to db: '+err);
		}
		//var query = client.query("SELECT * FROM users WHERE uname=dinu");
		var query = client.query("SELECT uname,pass,email,utype,hid FROM users WHERE uname = $1", [usrname],function(err, result) {
			if(err){
				console.log('Erro in query: '+err);
				response.redirect('/');
				return;
			}


			console.log('row:'+JSON.stringify(result.rows));
			if(result.rows[0]){
				if(result.rows[0].pass == pass){
					//TODO add session data
					request.session.USER_INFO= result.rows[0];
					response.redirect('/home');
					//return;
				}else{
					//invalid pass
					response.redirect('/');
				}
			}else{
				//invalid usrname
				response.redirect('/');
			}
			//done();
		});



});


});

app.get('/home', restrict, function home(request, response) {
    response.render('home.html',{
    	user: request.session.USER_INFO
    });
	
});


app.get('/liststock',  function home(request, response) {
   console.log('request id:'+request.body.sid);
	var btype = request.body.btype;
	var quentity = request.body.qun;
	var sql = 'SELECT instocks.sid,hospital.hname, instocks.ava_quntty, instocks.exp, instocks.btype, instocks.remark FROM  public.instocks,  public.hospital WHERE hospital.hid = instocks.hid';
	

	pg.connect(config.dburl, function(err, client) {
		if(err){
			console.log('Error in connect to db: '+err);
		}

		client.query(sql,function(err,result){
			
			if(err){
				console.log('Erro in query: '+err);
				response.statusCode=400;
				response.send('error occurred');
				return;
			}

			var stockList=[];
		

			result.rows.forEach(function(entry) {
			    var tempRow= {'group':entry.btype,'avail':entry.ava_quntty,
			    'exp':entry.exp,
			    'remark':entry.remark,
			    'hospital':entry.hname,
			     'option':'<button type="button" data-id="'+entry.sid+'" data-toggle="modal" data-target="#stockRequest" class="btn btn-primary btn-sm blood-req">Request</button>'}
			    
			     stockList.push(tempRow);
			
			});
			response.send({"data": stockList});
		//	done();
		});

		
	});
	
	
});

app.get('/listrequests',  function home(request, response) {
	
	var sql = 'SELECT hospital.hname, requests.comment,requests.btype, requests.quntty FROM public.requests,public.hospital WHERE requests.from_hid = hospital.hid AND requests.to_hid=$1';
	

	pg.connect(config.dburl, function(err, client) {
		if(err){
			console.log('Error in connect to db: '+err);
		}

		client.query(sql,[request.session.USER_INFO.hid],function(err,result){
			
			if(err){
				console.log('Erro in query: '+err);
				response.statusCode=400;
				response.send('error occurred');
				return;
			}

			var stockList=[];
		

			result.rows.forEach(function(entry) {
			    var tempRow= {'group':entry.btype,'quntty':entry.quntty,
			    'exp':entry.exp,
			    'comment':entry.comment,
			    'hospital':entry.hname,
			     'option':'<button type="button" data-id="'+entry.sid+'" data-toggle="modal" data-target="#stockResponse" class="btn btn-primary btn-sm blood-req">Response</button>'}
			    
			     stockList.push(tempRow);
			
			});
			response.send({"data": stockList});
		//	done();
		});

		
	});
	
	
});

app.get('/listmyrequests',  function home(request, response) {
	
	var sql = 'SELECT hospital.hname, requests.comment,requests.btype, requests.quntty FROM public.requests,public.hospital WHERE requests.to_hid = hospital.hid AND requests.from_hid=$1';
	

	pg.connect(config.dburl, function(err, client) {
		if(err){
			console.log('Error in connect to db: '+err);
		}

		client.query(sql,[request.session.USER_INFO.hid],function(err,result){
			
			if(err){
				console.log('Erro in query: '+err);
				response.statusCode=400;
				response.send('error occurred');
				return;
			}

			var stockList=[];
		

			result.rows.forEach(function(entry) {
			    var tempRow= {'group':entry.btype,'quntty':entry.quntty,
			    'exp':entry.exp,
			    'comment':entry.comment,
			    'hospital':entry.hname,
			     'option':'<button type="button" data-id="'+entry.sid+'" data-toggle="modal" data-target="#stockResponse" class="btn btn-primary btn-sm blood-req">Response</button>'}
			    
			     stockList.push(tempRow);
			
			});
			response.send({"data": stockList});
		//	done();
		});

		
	});
	
	
});


app.post('/stock',  function home(request, response) {

	var hid=request.session.USER_INFO.hid;

	pg.connect(config.dburl, function(err, client) {
		if(err){
			console.log('Error in connect to db: '+err);
		}


		var sql = 'INSERT INTO instocks (btype,quntty,exp,remark,hid,reserve,ava_quntty) VALUES($1,$2,$3,$4,$5,$6,$7)';
		var dateStrPart=request.body.expdate.split('-');
		client.query(sql,[request.body.bloodType,request.body.bQuantity,new Date(dateStrPart[2],dateStrPart[1],dateStrPart[0]),request.body.remark,hid,new Date(),request.body.bQuantity],function(err,result){
			if(err){
				console.log('Erro in query: '+err);
				response.statusCode=400;
				response.send('Sorry, Error occurred');
				return;
			}

			if(result.rowCount>0){
				
				response.statusCode=201;
				response.send('New stock succesfully added.');
			}else{
				
				response.statusCode=200;
				response.send('Sorry, No record was added.');
			}
		});

	});	
});


app.get('/hospitalstock',  function home(request, response) {

	console.log('request id:'+request.body.sid);
	var hid =request.session.USER_INFO.hid;
	var sql;
	if(hid){
		sql = 'SELECT sid,btype,quntty,exp,remark,reserve FROM instocks WHERE hid=$1';
	}else{
		sql = 'SELECT sid,btype,quntty,exp,remark,reserve FROM instocks ';
	}

	pg.connect(config.dburl, function(err, client) {
		if(err){
			console.log('Error in connect to db: '+err);
		}

		client.query(sql,[hid],function(err,result){
			
			if(err){
				console.log('Erro in query: '+err);
				response.statusCode=400;
				response.send('error occurred');
				return;
			}

			var hotTabData=[];
		

			result.rows.forEach(function(entry) {
			    var tempRow= {'group':entry.btype,'quentity':entry.quntty,
			    'exp':entry.exp,
			    'remark':entry.remark,
			    'reserve':entry.reserve,
			     'option':'<button type="button" data-tboggle="modal" data-target="#docAvailbleTime" class="btn btn-info btn-sm">More</button>'+
			     '&nbsp;<button type="button" data-toggle="modal" data-target="#docAvailbleTime" class="btn btn-primary btn-sm">Edit</button>'+
			     '&nbsp;<button type="button" data-toggle="modal" data-target="#docAvailbleTime" class="btn btn-danger btn-sm">Del</button>'+
			 	'&nbsp;<button type="button" data-toggle="modal" data-target="#docAvailbleTime" class="btn btn-success btn-sm">(-)</button>'	}
			    
			     hotTabData.push(tempRow);
			
			});
			response.send({"data": hotTabData});
		//	done();
		});

		
	});
	
	
});


app.post('/hospital',  function home(request, response) {

	console.log('request:'+JSON.stringify(request.body));
	pg.connect(config.dburl, function(err, client) {
		if(err){
			console.log('Error in connect to db: '+err);
		}


		var sql = 'INSERT INTO hospital (hname,pov,dis,city,descr) VALUES($1,$2,$3,$4,$5)';
		client.query(sql,[request.body.hname,request.body.hprovince,request.body.hdist,request.body.hcity,request.body.hdesc],function(err,result){
			if(err){
				console.log('Erro in query: '+err);
				response.statusCode=400;
				response.send('error occurred');
				return;
			}

			if(result.rowCount>0){
				
				response.statusCode=201;
				response.send('New hospital succesfully added.');
			}else{
				
				response.statusCode=200;
				response.send('Sorry No record was added.');
			}
		});

		
	});

	//response.send('OK');
});

app.get('/hospital',  function home(request, response) {

	console.log('request id:'+request.body.hid);
	var sql;
	if(request.body.hid){
		sql = 'SELECT hid,hname,pov,dis,city FROM hospital WHERE=$1';
	}else{
		sql = 'SELECT hid,hname,pov,dis,city FROM hospital ';
	}

	pg.connect(config.dburl, function(err, client) {
		if(err){
			console.log('Error in connect to db: '+err);
		}

		client.query(sql,function(err,result){
			
			if(err){
				console.log('Erro in query: '+err);
				response.statusCode=400;
				response.send('error occurred');
				return;
			}

			var hotTabData=[];
		

			result.rows.forEach(function(entry) {
			    var tempRow= {'name':entry.hname,'loc':entry.pov+','+entry.dis,
			    'avail':'','exp':'',
			     'dtls':'<button type="button" data-toggle="modal" data-target="#docAvailbleTime" class="btn btn-primary">Details</button>',
			     'del':'<button type="button" data-toggle="modal" data-target="#docAvailbleTime" class="btn btn-primary">(-)</button>'};
			    
			     hotTabData.push(tempRow);
			
			});
			response.send({"data": hotTabData});
		//	done();
		});

		
	});
	
	
});


app.get('/logout',  function home(request, response) {
   
	// destroy the user's session to log them out                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
  // will be re-created next request                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
  request.session.destroy(function(){                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       
    response.redirect('/');                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
  }); 
});



app.post('/requeststock',  function home(request, response) {
   
	console.log('request:'+JSON.stringify(request.body));



	pg.connect(config.dburl, function(err, client) {
		if(err){
			console.log('Error in connect to db: '+err);
		}

		var sql = 'SELECT hid FROM instocks WHERE instocks.sid=$1';
	
		client.query(sql,[request.body.stockId],function(err,result){
			
			if(err){
				console.log('Erro in query: '+err);
				response.statusCode=400;
				response.send('error occurred');
				return;
			}

			var stockList=[];
			if(result.rows[0]){
				console.log('hospital Id : '+result.rows[0].hid);
				var reqHid =result.rows[0].hid;

				var sql = 'INSERT INTO requests (from_hid,to_hid,comment,btype,quntty,status) VALUES($1,$2,$3,$4,$5,$6)';
				
				client.query(sql,[request.session.USER_INFO.hid,reqHid,request.body.reqComment,request.body.bloodType,request.body.reqStock,false],function(err,result){
					if(err){
						console.log('Erro in query: '+err);
						response.statusCode=400;
						response.send('error occurred');
						return;
					}

					if(result.rowCount>0){
						
						response.statusCode=201;
						response.send('New blood request succesfully added.');
					}else{
						
						response.statusCode=200;
						response.send('Sorry No record was added.');
					}
				});
			}
		//	done();
		});





		
	});

});

function restrict(req, res, next) {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
  if (req.session.USER_INFO) {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
    next();                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
  } else {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
    req.session.error = 'Access denied!';                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
    res.redirect('/');                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
  }                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
}   


app.listen(app.get('port'), function() {
	console.log("Node app is running at localhost:" + app.get('port'));
});



