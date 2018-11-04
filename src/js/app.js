App = {
  web3Provider: null,
  ownersInstanceGlob: null,
  nbUserReservations: 0,
  nbAllReservations: 0,
  account: 0x0,
  contracts: {},
  isManager: false,
  justInit: true,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
      if (typeof web3 !== 'undefined') {
        // If a web3 instance is already provided by Meta Mask.
        App.web3Provider = web3.currentProvider;
        web3 = new Web3(web3.currentProvider);
      } else {
        // Specify default instance if no web3 instance provided
        App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
        web3 = new Web3(App.web3Provider);
      }
      App.displayAccountInfo();

      return App.initContract();
  },

  displayAccountInfo: function() {
        web3.eth.getCoinbase(function(err, account) {
            if(err === null) {
                App.account = account;
                $('#account').text("your account : " + account);
                web3.eth.getBalance(account, function(err, balance) {
                    if(err == null) {
                        $('#accountBalance').text("Balance: "+web3.fromWei(balance, "ether") + " ETH");
                    } else {
                        $('#accountBalance').text(err);
                    }
                })
            }
        });
  },

  initContract: function() {
    $.getJSON("Coladay.json", function(coladay) {
        // Instantiate a new truffle contract from the artifact
        App.contracts.Coladay = TruffleContract(coladay);

        // Connect provider to interact with contract
        App.contracts.Coladay.setProvider(App.web3Provider);
        App.bindEvents();

        return App.render();
    });

  },

  render: function() {
      App.contracts.Coladay.deployed().then(function(instance){
          App.ownersInstanceGlob = instance;
          instance.isOwner().then(function(data) {
              App.isManager = data;
          });

          return App.ownersInstanceGlob.getAllReservationsSize();
      }).then(function(data) {

          App.listenEvent();

          // display available slots
          App.nbAllReservations = data;
          $('#allReservationLength').text("all slots reserved: " + data);
          App.displayAvailableSlots();

          // display user reservation
          App.ownersInstanceGlob.getUserReservationSize(App.account).then(
              function(data){
                  App.nbUserReservations = data;
                  $('#userReservationLength').text("slots reserved by you: " + data);
                  App.displayUserReservation();
          });
     });
  },

  listenEvent: function() {
      var bookEvent = App.ownersInstanceGlob.bookEvent();
      bookEvent.watch(function(error, result){

          if(!error && !App.justInit) {

              App.ownersInstanceGlob.getUserReservationSize(App.account).then(
                  function(data){
                      App.nbUserReservations = data;
                      $('#userReservationLength').text("slots reserved: " + data);
              });

              App.ownersInstanceGlob.getAllReservationsSize().then(
                  function(data){
                      App.nbAllReservations = data;
                      $('#allReservationLength').text("all slots reserved: " + data);
              });

              var slotId = web3.toAscii(result.args.slotId);
              console.log("calling book event : " + slotId);

              document.getElementById(slotId).innerHTML = "<p class=\"text-danger\"><b>" + parseInt(slotId.substring(3)) + "h</b></p>";

              // update reservation table
              var rowId = slotId.substring(0,3);
              var row = $("#"+rowId);
              var hour = parseInt(slotId.substring(3));

              if(row.length == 0) {
                  // room doesn't exist, create row
                  console.log("**** don't exist >>> book triggered: " + slotId);
                  var trId = slotId.substring(0,3);
                  var company = slotId.substring(0,1);
                  var room = slotId.substring(1,3);
                  var roomsSelectedBody = $('#roomsSelectedBody');
                  var companyName="";

                  if(company == "C") {
                      companyName = "<center><b>Coca</b></center>";
                  } else if(company == "P"){
                      companyName = "<center><b>Pepsi</b></center>";
                  }

                  var markup = "<tr id=\"" + trId +  "\" ><td company-id=\"" + company + "\">" + companyName+ "</td><td room-id=\"" + room + "\"><center><b>" + room + "</b></center></td><td id=\"" + slotId +"\">" + hour+ "h <input type=\"checkbox\"></td>";

                  for(i = 0; i<= 9; i++) {
                      markup = markup + "<td></td>";
                  }

                  markup = markup + "</tr>";
                  roomsSelectedBody.append(markup);

              } else if(row.length && row.find("td[id='" + slotId + "']").length == 0) {
                  // room exist, create cell
                  console.log("***** exist >>> book triggered: " + slotId);
                  console.log("***** row & td DONT exist for hour : " + hour);
                  updateEmptyTd = row.find('td:empty:first');
                  updateEmptyTd.attr('id', slotId);
                  updateEmptyTd.append(hour + "h <input type=\"checkbox\">");
              }
          }
      });

      var cancelEvent = App.ownersInstanceGlob.cancelEvent();
      cancelEvent.watch(function(error, result){

          if(!error && !App.justInit) {

              App.ownersInstanceGlob.getUserReservationSize(App.account).then(
                  function(data){
                      App.nbUserReservations = data;
                      $('#userReservationLength').text("slots reserved: " + data);
              });

              App.ownersInstanceGlob.getAllReservationsSize().then(
                  function(data){
                      App.nbAllReservations = data;
                      $('#allReservationLength').text("all slots reserved: " + data);
              });

              var slotId = web3.toAscii(result.args.slotId);

              document.getElementById(slotId).innerHTML = parseInt(slotId.substring(3)) + "h <input type=\"checkbox\">";

              // supprimer la cellule
              // set td hour-id to ""
              // replace inner to nothing
              console.log("remove checkbox of : " + slotId);
              var tr = $("#roomsSelectedBody").find("tr[id='" + slotId.substring(0,3) + "']");
              var td = tr.find("td[id='" + slotId + "']");
              td.text("");
              td.removeAttr("id");

              var tdEmpty = tr.find("td input:checkbox");
              if(tdEmpty.length == 0) {
                  tr.remove();
              }
          }
      });
  },

  showRows: function(reservedRooms, companyId) {
      var roomsBody;
      if(companyId == "C") {
          roomsBody = $('#roomsBodyCoca');
      } else if(companyId == "P") {
          roomsBody = $('#roomsBodyPepsi');
      }
      roomsBody.append("<tr><th><center>Room</center></th><th colspan=\"11\"><center>Slots</center></th></tr>");

      for(i = 1; i <= 10; i++) {
          var roomId = "";
          if(i == 10) {
              roomId = "10";
          } else {
              roomId = "0"+i;
          }
          var roomName = "<td><center><b>" + roomId + "</b></center></td>";

          // hour checkboxes
          var checkboxes = "";
          for(j = 8; j <= 18; j++) {
              var hourAppend;
              if(j<10) {
                  hourAppend = "0"+j;
              } else {
                  hourAppend = ""+j;
              }

              var slotId = companyId + roomId + hourAppend;

              if ($.inArray(slotId, reservedRooms) > -1 ) {
                  // room is already taken
                  checkboxes = checkboxes + "<td id=\"" + slotId + "\"><p class=\"text-danger\"><b>"+j+"h" + "</b></p></td>";
              } else {
                  checkboxes = checkboxes + "<td id=\"" + slotId + "\">"+j+"h " + "<input type=\"checkbox\"></td>";
              }
          }

          var markup = "<tr company-id=\"" + companyId + "\" room-id=\""+ roomId +"\" >" + roomName + checkboxes + "</tr>";
          roomsBody.append(markup);
      }
      //var button = "<tr><td colspan=\"12\"><center><button type=\"submit\" class=\"btn btn-primary btn_booking\">Book Room</button></center></td></tr>";
      //roomsBody.append(button);
  },

  displayAvailableSlots: function() {
      var reservedRooms = [];
      var displayTrigger = 0;

      if(App.nbAllReservations == 0) {
          App.showRows(reservedRooms,"C");
          App.showRows(reservedRooms,"P");
      } else {
          for(i = 0; i < App.nbAllReservations; i++) {
              App.ownersInstanceGlob.getReservation(i).then(function(data){
                  reservedRooms.push(web3.toAscii(data));
                  displayTrigger++;

                  if(displayTrigger == App.nbAllReservations) {
                      reservedRooms.sort();
                      App.showRows(reservedRooms,"C");
                      App.showRows(reservedRooms,"P");
                  }
              });
          }
      }
  },

  displayUserReservation: function() {
      var roomsSelectedBody = $('#roomsSelectedBody');
      var displayTrigger = 0;
      var userSlots = [];

      roomsSelectedBody.append("<tr><th><center>Company</center></th><th><center>Room</center></th><th colspan=\"11\"><center>Slots</center></th></tr>");

      for(i = 0; i < App.nbUserReservations; i++) {
          App.ownersInstanceGlob.getReservationFromUser(App.account, i).then(function(data){
              userSlots.push(web3.toAscii(data)); //["C0112"]
              displayTrigger++;

              if(displayTrigger == App.nbUserReservations) {
                  userSlots.sort();
                  var currentRoom;
                  var markup = "<tr";
                  var tdCount = 0;
                  var tdMax = 12;

                  var companyName="";

                  for(j = 0; j < App.nbUserReservations; j++) {
                      var company = userSlots[j].substring(0,1); // "C"
                      var room = userSlots[j].substring(1,3); // "01"
                      var hour = parseInt(userSlots[j].substring(3)); // "12"

                      if(company == "C") {
                          companyName="<center><b>Coca</b></center>";
                      } else if (company == "P") {
                          companyName="<center><b>Pepsi</b></center>";
                      }

                      if(currentRoom == null) {
                          currentRoom = company + room;
                          markup = markup + " id=\"" +company + room +  "\" ><td company-id=\"" + company + "\">" + companyName+ "</td><td room-id=\"" + room + "\"><center><b>" + room + "</b></center></td><td id=\"" + userSlots[j]+"\">" + hour+ "h <input type=\"checkbox\"></td>";
                          tdCount = tdCount + 3;
                      } else if(currentRoom == company + room) {
                          markup = markup + "<td id=\"" + userSlots[j]+"\">" + hour+ "h <input type=\"checkbox\"></td>";
                          tdCount++;
                      } else if(currentRoom != company + room){
                          // fermeture du <tr> et creation d'une nouvelle ligne
                          for(i = tdCount; i<= tdMax; i++) {
                              markup = markup + "<td></td>";
                          }
                          currentRoom = company + room;

                          markup = markup + "</tr><tr id=\"" + company + room + "\" ><td company-id=\"" + company + "\">" + companyName + "</td><td room-id=\"" + room + "\"><b><center>" + room + "</center></b></td><td id=\"" + userSlots[j]+"\">" + hour + "h <input type=\"checkbox\"></td>";
                          tdCount=3;
                      }
                  }
                  // last line
                  for(i = tdCount; i<= tdMax; i++) {
                      markup = markup + "<td></td>";
                  }
                  markup = markup + "</tr>";
                  roomsSelectedBody.append(markup);

              }
          });
      }
  },

  bindEvents: function() {
    $(document).on('click', '.btn_booking', App.handleBtnBooking);
    $(document).on('click', '.btn_cancel', App.handleBtnCancel);
  },

  handleBtnBooking: function() {
      if(App.isManager) {
          $('#warning').modal('show');
      } else {
          console.log( $(this).attr('id'));
          var table;
          if($(this).attr('id') == "btn_coca_book") {
              table = $("#roomsBodyCoca");
          } else {
              table = $("#roomsBodyPepsi");
          }
          var timeSlots = [];

          for(j = 1; j < 11; j++) {
              var row = table.find("tr:eq("+j+")");
              for(i = 1; i < 12 ; i++) {
                  if(row.find("td:eq("+i+")").find("input[type=checkbox]").is(':checked')) {
                      var slotId = row.find("td:eq("+i+")").attr('id');
                      timeSlots.push(web3.fromAscii(slotId));
                      console.log("BOOK THIS >>> " + slotId + " / " + web3.fromAscii(slotId));
                  }
              }
          }

          if(timeSlots.length > 0) {
              var gasLimit = timeSlots.length * 140000;
              App.ownersInstanceGlob.bookSlots(timeSlots, {
                  from: App.account,
                  gas: gasLimit
              }).catch(function(error) {
                  console.error(error);
              });

              App.justInit = false;
          }
      }
  },

  handleBtnCancel: function() {
      var rowLength = document.getElementById('roomsSelectedBody').rows.length;
      var timeSlots= [];

      for(j = 1; j < rowLength; j++) {
          var row = $("#roomsSelectedBody").find("tr:eq("+j+")");
          for(i = 2; i<=12 ; i++) {
              if(row.find("td:eq("+i+")").find("input[type=checkbox]").is(':checked')) {
                  var slotId = row.find("td:eq("+i+")").attr('id');
                  timeSlots.push(web3.fromAscii("" + slotId));
                  console.log("CANCEL THIS >>> " + slotId + " / " + web3.fromAscii("" + slotId));
              }
          }
      }

      if(timeSlots.length > 0) {
          var gasLimit = timeSlots.length * 140000;

          App.ownersInstanceGlob.cancelReservations(timeSlots, {
              from: App.account,
              gas: gasLimit
          }).catch(function(error) {
              console.error(error);
          });

          App.justInit = false;
      }
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
