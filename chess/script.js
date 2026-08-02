"use strict";

let board;
let game=new Chess();
let engine=STOCKFISH();

let playerColor="white";
let engineColor="black";

let boardOrientation="white";
let thinking=false;
let gameStarted=false;
let promotionMove=null;

let capturedWhite=[];
let capturedBlack=[];
let moveHistory=[];

const statusEl=document.getElementById("status");
const turnEl=document.getElementById("turn");
const evalEl=document.getElementById("eval");
const moveHistoryEl=document.getElementById("moveHistory");
const capturedByWhite=document.getElementById("capturedByWhite");
const capturedByBlack=document.getElementById("capturedByBlack");

const menu=document.getElementById("menu");
const gameArea=document.getElementById("gameArea");

const popup=document.getElementById("promotionPopup");
const gameOver=document.getElementById("gameOver");

const newBtn=document.getElementById("newGame");
const undoBtn=document.getElementById("undo");
const flipBtn=document.getElementById("flip");

const playWhite=document.getElementById("playWhite");
const playBlack=document.getElementById("playBlack");

const resultTitle=document.getElementById("gameResult");
const playAgain=document.getElementById("playAgain");

const promotionPieces={
q:document.getElementById("promoQ"),
r:document.getElementById("promoR"),
b:document.getElementById("promoB"),
n:document.getElementById("promoN")
};

function createBoard(){

board=Chessboard("board",{

draggable:true,

position:"start",

orientation:boardOrientation,

pieceTheme:"https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png",

moveSpeed:150,

snapSpeed:60,

snapbackSpeed:60,

trashSpeed:80,

onDragStart:onDragStart,

onDrop:onDrop,

onSnapEnd:onSnapEnd

});

}

function initEngine(){

engine.postMessage("uci");

engine.postMessage("ucinewgame");

engine.postMessage("setoption name Threads value 2");

engine.postMessage("setoption name Hash value 64");

engine.postMessage("setoption name Skill Level value 10");

engine.postMessage("setoption name UCI_LimitStrength value true");

engine.postMessage("setoption name UCI_Elo value 1600");

engine.onmessage=function(event){

let line=typeof event==="string"?event:event.data;

if(!line)return;

parseEngineMessage(line);

};

}

function startGame(color){

playerColor=color;

engineColor=color==="white"?"black":"white";

boardOrientation=color;

game.reset();

capturedWhite=[];

capturedBlack=[];

moveHistory=[];

thinking=false;

gameStarted=true;

menu.style.display="none";

gameArea.style.display="flex";

board.orientation(boardOrientation);

board.position("start");

statusEl.textContent="Game Started";

turnEl.textContent="White";

evalEl.textContent="0.0";

capturedByWhite.innerHTML="";

capturedByBlack.innerHTML="";

moveHistoryEl.innerHTML="";

engine.postMessage("ucinewgame");

if(engineColor==="white"){

setTimeout(makeEngineMove,400);

}

}

window.onload=function(){

createBoard();

initEngine();

gameArea.style.display="none";

playWhite.onclick=function(){

startGame("white");

};

playBlack.onclick=function(){

startGame("black");

};

};
function onDragStart(source,piece){

    if(!gameStarted)return false;

    if(thinking)return false;

    if(game.game_over())return false;

    if(game.turn()==="w"&&playerColor!=="white")return false;

    if(game.turn()==="b"&&playerColor!=="black")return false;

    if(playerColor==="white"&&piece.startsWith("b"))return false;

    if(playerColor==="black"&&piece.startsWith("w"))return false;

    return true;

}
function onDrop(source,target){

    removeHighlights();

    let move=game.move({
        from:source,
        to:target,
        promotion:"q"
    });

    if(move===null){
        return "snapback";
    }

    thinking=true;

    board.position(game.fen(),true);

    moveHistory.push(move.san);

    updateMoveHistory();

    updateCapturedPieces(move);

    updateStatus();

    highlightMove(source,target);

    if(game.game_over()){

        thinking=false;

        showGameResult();

        return;

    }
function removeHighlights(){

    $("#board .square-55d63").removeClass(
        "highlight-white highlight-black highlight-last highlight-check"
    );

}
function highlightMove(from,to){

    removeHighlights();

    let fromSquare=document.querySelector(
        "#board .square-"+from
    );

    let toSquare=document.querySelector(
        "#board .square-"+to
    );

    if(fromSquare){

        fromSquare.classList.add("highlight-last");

    }

    if(toSquare){

        toSquare.classList.add("highlight-last");

    }

    if(game.in_check()){

        let kingSquare=null;

        let color=game.turn();

        let boardData=game.board();

        for(let r=0;r<8;r++){

            for(let c=0;c<8;c++){

                let piece=boardData[r][c];

                if(
                    piece &&
                    piece.type==="k" &&
                    piece.color===color
                ){

                    let file=String.fromCharCode(97+c);

                    let rank=8-r;

                    kingSquare=file+rank;

                    break;

                }

            }

            if(kingSquare)break;

        }

        if(kingSquare){

            let king=document.querySelector(
                "#board .square-"+kingSquare
            );

            if(king){

                king.classList.add("highlight-check");

            }

        }

    }

}
function updateMoveHistory(){

    moveHistoryEl.innerHTML="";

    for(let i=0;i<moveHistory.length;i+=2){

        let row=document.createElement("div");
        row.className="move";

        let number=document.createElement("span");
        number.textContent=(i/2+1)+".";

        let white=document.createElement("span");
        white.textContent=moveHistory[i]||"";

        let black=document.createElement("span");
        black.textContent=moveHistory[i+1]||"";

        row.appendChild(number);
        row.appendChild(white);
        row.appendChild(black);

        moveHistoryEl.appendChild(row);

    }

    moveHistoryEl.scrollTop=moveHistoryEl.scrollHeight;

}
function updateCapturedPieces(move){

    if(!move.captured)return;

    let piece=move.captured;

    if(move.color==="w"){

        capturedWhite.push(piece);

    }else{

        capturedBlack.push(piece);

    }

    renderCapturedPieces();

}

function renderCapturedPieces(){

    capturedByWhite.innerHTML="";
    capturedByBlack.innerHTML="";

    capturedWhite.forEach(function(p){

        let img=document.createElement("img");

        img.src="https://chessboardjs.com/img/chesspieces/wikipedia/b"+p.toUpperCase()+".png";

        img.alt=p;

        capturedByWhite.appendChild(img);

    });

    capturedBlack.forEach(function(p){

        let img=document.createElement("img");

        img.src="https://chessboardjs.com/img/chesspieces/wikipedia/w"+p.toUpperCase()+".png";

        img.alt=p;

        capturedByBlack.appendChild(img);

    });

}
    setTimeout(function(){

        makeEngineMove();

    },250);

}
