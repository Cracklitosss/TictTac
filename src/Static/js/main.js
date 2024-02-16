document.addEventListener('DOMContentLoaded', function() {
const url = "http://localhost:5555";
let socket = io(url);

var myTurn = true;
var symbol;


function getBoardState() {
  var obj = {};

  $(".board button").each(function() {
    obj[$(this).attr("id")] = $(this).text() || "";
  });

  return obj;
}

function isGameOver() {
    var state = getBoardState();
    var matches = ["XXX", "OOO"];

  
    var rows = [
      state.r0c0 + state.r0c1 + state.r0c2, // 1st line
      state.r1c0 + state.r1c1 + state.r1c2, // 2nd line
      state.r2c0 + state.r2c1 + state.r2c2, // 3rd line
      state.r0c0 + state.r1c0 + state.r2c0, // 1st column
      state.r0c1 + state.r1c1 + state.r2c1, // 2nd column
      state.r0c2 + state.r1c2 + state.r2c2, // 3rd column
      state.r0c0 + state.r1c1 + state.r2c2, // Primary diagonal
      state.r0c2 + state.r1c1 + state.r2c0  // Secondary diagonal
    ];


    for (var i = 0; i < rows.length; i++) {
        if (rows[i] === matches[0] || rows[i] === matches[1]) {
            return true;
        }
    }

    return false;
}

function renderTurnMessage() {
    if (!myTurn) {
        $("#message").text("El turno de tu oponente");
        $(".board button").attr("disabled", true);
    } else {
        $("#message").text("Tu turno.");
        $(".board button").removeAttr("disabled");
    }
}

function makeMove(e) {
    if (!myTurn) {
        return;
    }

    if ($(this).text().length) {
        return;
    }

    socket.emit("make.move", {
        symbol: symbol,
        position: $(this).attr("id")
    });
}

socket.on("move.made", function(data) {
    $("#" + data.position).text(data.symbol); // Render move

    myTurn = data.symbol !== symbol;

    if (!isGameOver()) {
        renderTurnMessage();
    } else {
        if (myTurn) {
            $("#message").text("PERDISTE 😯😓");
            $("#message").css('background','#aa1f4d');
            $("#message").css('color','white');
        } else {
            $("#message").text("GANASTE 😎😎");
            $("#message").css('background','#16db93');
            $("#message").css('color','white');
        }

        $(".board button").attr("disabled", true);
    }
});

socket.on("game.begin", function(data) {
    symbol = data.symbol;
    myTurn = symbol === "X";
    renderTurnMessage();
});


socket.on("opponent.left", function() {
    $("#message").text("Tu oponente dejó el juego");
    $(".board button").attr("disabled", true);
});

$(function() {
  $(".board button").attr("disabled", true);  
  $(".board> button").on("click", makeMove);
});
});