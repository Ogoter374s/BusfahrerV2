import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import dotenv from "dotenv";
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import serviceAccount from './firebase-key.json' assert {type: "json"};
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid"
import { WebSocket, WebSocketServer } from 'ws';

dotenv.config();

const port = 3001;

const app = express();
app.use(cors());
app.use(express.json());

if(!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = getFirestore();

const wss = new WebSocketServer({port: 8080});

const activeGameConnections = new Map();
const waitingGameConnections = new Set();
const accountConnections = new Set();

wss.on("connection", (ws, req) => {
    ws.on("message", (message) => {
        const {type,gameId} = JSON.parse(message);
        if(type === "subscribe" && gameId) {
            if(!activeGameConnections.has(gameId)) {
                activeGameConnections.set(gameId, []);
            }
            activeGameConnections.get(gameId).push(ws);

            watchGameUpdates(gameId);
        }

        if(type === "lobby") {
            if(!waitingGameConnections.has(ws)) {
                waitingGameConnections.add(ws);
            }

            watchLobbyUpdates();
        }

        if(type === "account") {
            if(!accountConnections.has(ws)) {
                accountConnections.add(ws);
            }

            watchAccountUpdates();
        }
    });

    ws.on("close", () => {
        for(const [gameId, sockets] of activeGameConnections.entries()) {
            activeGameConnections.set(gameId, sockets.filter((client) => client !== ws));
        }

        waitingGameConnections.delete(ws);
        accountConnections.delete(ws);
    });
});

const watchLobbyUpdates = async () => {
    db.collection("games").where("status", "==", "waiting").onSnapshot((snapshot) => {
        const updatedLobbys = snapshot.docs.map((doc) => ({
            id: doc.id, ...doc.data(),
        }));

        const message = JSON.stringify({type: "lobbysUpdate", data: updatedLobbys});

        waitingGameConnections.forEach((client) => {
            if(client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });
};

const watchAccountUpdates = async () => {
    db.collection("users").onSnapshot((snapshot) => {
        const updatedUsers = snapshot.docs.map((doc) => ({
            id: doc.id, ...doc.data(),
        }));

        const message = JSON.stringify({type: "accountUpdate", data: updatedUsers});

        accountConnections.forEach((client) => {
            if(client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });
};

const watchGameUpdates = async (gameId) => {
    const gameRef = db.collection("games").doc(gameId);

    gameRef.onSnapshot((doc) => {
        if(!doc.exists) return;

        const updatedGame = doc.data();
        const clients = activeGameConnections.get(gameId) || [];

        clients.forEach((client) => {
            if(client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({type: "gameUpdate", data: updatedGame}));
            }
        });
    });
};

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    if(!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.VITE_JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch(error) {
        return res.status(403).json({ error: "Invalid token" });
    }
};

const createDeck = () => {
    const suits = ["hearts", "diamonds", "clubs", "spades"];
    const values = Array.from({length: 13}, (_, i) => i + 2);
    let deck = [];

    for(let i=0; i < 2; i++) {
        suits.forEach((suit) => {
            values.forEach((value) => {
                deck.push({number: value, type: suit});
            });
        });
    }

    return shuffleDeck(deck);
};

const shuffleDeck = (deck) => {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

const checkFaceCard = (player, card) => {
    if (![11, 12, 13].includes(card.number)) return;

    if (!player.drinks) player.drinks = 0;

    if (card.number === 11 && player.gender === "Male") {
        player.drinks += 1;
    }

    if (card.number === 12 && player.gender === "Female") {
        player.drinks += 1;
    }

    if (card.number === 13 || player.gender === "Divers") {
        player.drinks += 1;
    }
};

app.get("/get-waiting-games", async (req, res) => {
    try {
        const gamesSnapshot = await db.collection("games").where("status", "==", "waiting").get();
        const games = gamesSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));

        res.json(games);
    }
    catch(error) {
        console.error("Error fetching waiting games:", error);
        res.status(500).json({error: "Failed to fetch games"});
    }
});

app.get("/get-player-id", authenticateToken, async (req, res) => {
    const playerId = req.user.userId;
    return res.json(playerId);
});

app.get("/get-players/:gameId", async (req, res) => {
    const {gameId} = req.params;

    try {
        const gameRef = db.collection("games").doc(gameId);
        const gameSnapshot = await gameRef.get();

        if(!gameSnapshot.exists) {
            return res.status(404).json({error: "Game not found"});
        }

        const gameData = gameSnapshot.data();
        const players = gameData.players || [];

        res.json(players);
    }
    catch(error) {
        console.error("Error fetching players:", error);
        res.status(500).json({error: "Failed to fetch players"});
    }
});

app.get("/is-game-master", authenticateToken, async (req, res) => {
    const {gameId} = req.query;
    const playerId = req.user.userId;

    if(!gameId) {
        return res.status(400).json({ error: "Missing Game ID" });
    }

    try {
        const gameRef = db.collection("games").doc(gameId);
        const gameDoc = await gameRef.get();

        if(!gameDoc.exists) {
            return res.status(404).json({ error: "Game not found" });
        }

        const gameData = gameDoc.data();

        const isGameMaster = gameData.players.length > 0 && gameData.players[0].id === playerId;

        return res.json(isGameMaster);
    }
    catch(error) {
        console.error("Error verifying game master:", error);
        return res.status(401).json({ error: "Invalid or expired token" });
    }
});

app.get("/all-cards-played", authenticateToken, async (req, res) => {
    const {gameId} = req.query;
    const playerId = req.user.userId;

    if(!gameId) {
        return res.status(400).json({ error: "Missing Game ID" });
    }

    try {
        const gameRef = db.collection("games").doc(gameId);
        const gameDoc = await gameRef.get();

        if(!gameDoc.exists) {
            return res.status(404).json({ error: "Game not found" });
        }

        const gameData = gameDoc.data();

        const player = gameDoc.data().players.find(p => p.id === playerId);
        if(!player) return res.status(404).json({error: "Player not in game"});

        const pCards = player.cards;

        let filterCards;

        if(gameData.round === 1) {
            filterCards = pCards.filter(card => card.number >= 2 && card.number <= 10);
        }

        if(gameData.round === 2) {
            const players = gameData.players;
            let everyCardPlayed = true;
            players.forEach(p => {
                filterCards = p.cards.filter(card => card.number >= 11 && card.number <= 13);
                everyCardPlayed = filterCards.every(card => card.played === true);
            });

            return res.json(everyCardPlayed);
        }

        if(gameData.round === 3) {
            filterCards = pCards.filter(card => card.number === 14);
        }

        let hasPlayedAll = true;
         
        if(gameData.round <= 3) {
            hasPlayedAll = filterCards.every(card => card.played === true);
        }

        return res.json(hasPlayedAll);
    }
    catch(error) {
        console.error("Error checking all played cards:", error);
        return res.status(401).json({ error: "Invalid or expired token" });
    }
});

app.get("/get-game-cards", async (req, res) => {
    const {gameId} = req.query;

    const gameRef = db.collection("games").doc(gameId);
    const gameSnap = await gameRef.get();

    if(!gameSnap.exists) return res.status(404).json({error: "Game not found"});

    res.json(gameSnap.data().cards);
});

app.get("/get-phase-cards", async (req, res) => {
    const {gameId} = req.query;

    const gameRef = db.collection("games").doc(gameId);
    const gameSnap = await gameRef.get();

    if(!gameSnap.exists) return res.status(404).json({error: "Game not found"});

    res.json(gameSnap.data().phaseCards);
});

app.get("/get-player-cards", authenticateToken, async (req, res) => {
    const {gameId} = req.query;
    const playerId = req.user.userId;

    const gameRef = db.collection("games").doc(gameId);
    const gameSnap = await gameRef.get();

    if(!gameSnap.exists) return res.status(404).json({error: "Game not found"});

    const player = gameSnap.data().players.find(p => p.id === playerId);
    if(!player) return res.status(404).json({error: "Player not in game"});

    res.json(player.cards || []);
});

app.get("/get-current-player", authenticateToken, async (req, res) => {
    const {gameId} = req.query;
    const userId = req.user.userId;

    try {
        const gameRef = db.collection("games").doc(gameId);
        const gameSnapshot = await gameRef.get();

        if(!gameSnapshot.exists) {
            return res.status(404).json({error: "Game not found"});
        }

        const gameData = gameSnapshot.data();

        const playerId = gameData.activePlayer;

        const player = gameData.players.find(p => p.id === playerId);
        if(!player) return res.status(404).json({error: "Player not in game"});

        if(gameData.phase === "phase2") {
            if(gameData.round === 2) {
                const lPlayer = gameData.players.find(p => p.id === userId);
                if(!lPlayer) return res.status(404).json({error: "Player not in game"});

                const playerName = lPlayer.name;

                return res.json({playerId, playerName});
            }
        }

        const playerName = player.name;

        res.json({playerId, playerName});
    }
    catch(error) {
        console.error("Error fetching current player:", error);
        res.status(500).json({error: "Failed to fetch current player"});
    }
});

app.get("/get-busfahrer", async (req, res) => {
    const {gameId} = req.query;

    try {
        const gameRef = db.collection("games").doc(gameId);
        const gameSnapshot = await gameRef.get();

        if(!gameSnapshot.exists) {
            return res.status(404).json({error: "Game not found"});
        }

        const gameData = gameSnapshot.data();
        const playerIds = gameData.busfahrer;

        let busfahrerName = "";

        playerIds.forEach(id => {
            const player = gameData.players.find(p => p.id === id);
            if(!player) return res.status(404).json({error: "Player not in game"});

            if(busfahrerName === "") {
                busfahrerName = player.name;
            } else {
                busfahrerName += ` & ${player.name}`;
            }
        });

        res.json({busfahrerName, playerIds});
    }
    catch(error) {
        console.error("Error fetching current player:", error);
        res.status(500).json({error: "Failed to fetch current player"});
    }
});

app.get("/get-drink-count", authenticateToken, async (req, res) => {
    const {gameId} = req.query;
    const userId = req.user.userId;

    try {
        const gameRef = db.collection("games").doc(gameId);
        const gameSnapshot = await gameRef.get();

        if(!gameSnapshot.exists) {
            return res.status(404).json({error: "Game not found"});
        }

        const gameData = gameSnapshot.data();

        if(gameData.phase === "phase2") {
            if(gameData.round === 2) {
                const player = gameData.players.find(p => p.id === userId);
                if(!player) return res.status(404).json({error: "Player not in game"});

                const drinks = player.drinks;

                return res.json(drinks);
            }
        }
        
        const drinks = gameData.drinkCount;

        res.json(drinks);
    }
    catch(error) {
        console.error("Error fetching current player:", error);
        res.status(500).json({error: "Failed to fetch current player"});
    }
});

app.get("/get-has-to-ex", async (req, res) => {
    const {gameId} = req.query;

    try {
        const gameRef = db.collection("games").doc(gameId);
        const gameSnapshot = await gameRef.get();

        if(!gameSnapshot.exists) {
            return res.status(404).json({error: "Game not found"});
        }

        const gameData = gameSnapshot.data();

        const playerId = gameData.activePlayer;

        const player = gameData.players.find(p => p.id === playerId);
        if(!player) return res.status(404).json({error: "Player not in game"});

        const exen = player.exen;

        return res.json(exen);
        
    }
    catch(error) {
        console.error("Error checking to ex:", error);
        res.status(500).json({error: "Failed to check to ex"});
    }
});

app.get("/get-round", async (req, res) => {
    const {gameId} = req.query;

    try {
        const gameRef = db.collection("games").doc(gameId);
        const gameSnapshot = await gameRef.get();

        if(!gameSnapshot.exists) {
            return res.status(404).json({error: "Game not found"});
        }

        const gameData = gameSnapshot.data();
        const round = gameData.round;

        res.json(round);
    }
    catch(error) {
        console.error("Error fetching round:", error);
        res.status(500).json({error: "Failed to fetch round"});
    }
});

app.get("/get-is-row-flipped", async (req, res) => {
    const {gameId} = req.query;

    try {
        const gameRef = db.collection("games").doc(gameId);
        const gameSnapshot = await gameRef.get();

        if(!gameSnapshot.exists) {
            return res.status(404).json({error: "Game not found"});
        }

        const gameData = gameSnapshot.data();

        const flipped = (gameData.round === gameData.lastRound) || (gameData.round === 6);
        
        res.json(flipped);
    }
    catch(error) {
        console.error("Error fetching current player:", error);
        res.status(500).json({error: "Failed to fetch current player"});
    }
});

app.get("/get-end-game", async (req, res) => {
    const {gameId} = req.query;

    try {
        const gameRef = db.collection("games").doc(gameId);
        const gameSnapshot = await gameRef.get();

        if(!gameSnapshot.exists) {
            return res.status(404).json({error: "Game not found"});
        }

        const gameData = gameSnapshot.data();
        const end = gameData.endGame;

        res.json(end);
    }
    catch(error) {
        console.error("Error fetching end game:", error);
        res.status(500).json({error: "Failed to fetch end game"});
    }
});

app.get("/get-statistics", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const userRef = db.collection("users").doc(userId);
        const userSnapshot = await userRef.get();

        if(!userSnapshot.exists) {
            return res.status(404).json({error: "User not found"});
        }

        const userData = userSnapshot.data();
        const stats = userData.statistics;

        res.json(stats);
    }
    catch(error) {
        console.error("Error fetching user name:", error);
        res.status(500).json({error: "Failed to fetch user name"});
    }
});

app.get("/get-username", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const userRef = db.collection("users").doc(userId);
        const userSnapshot = await userRef.get();

        if(!userSnapshot.exists) {
            return res.status(404).json({error: "User not found"});
        }

        const userData = userSnapshot.data();
        const name = userData.username;

        res.json(name);
    }
    catch(error) {
        console.error("Error fetching user statistics:", error);
        res.status(500).json({error: "Failed to fetch user statistics"});
    }
});

app.post("/register", async (req, res) => {
    const {username, password} = req.body;

    try {   
        const usersRef = db.collection("users");
        const existingUser = await usersRef.where("username", "==", username).get();

        if(!existingUser.empty) {
            return res.status(400).json({error: "Username already exists"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();

        const stats = {
            gamesPlayed: 0,
            gamesBusfahrer: 0,
            drinksGiven: 0,
            drinksSelf: 0,
            numberEx: 0,
            maxDrinksGiven: 0,
            maxDrinksSelf: 0,
            maxCardsSelf: 0,
            layedCards: 0
        };

        await usersRef.doc(userId).set({
           username, 
           password: hashedPassword, 
           createdAt: new Date(),
           lastLogin: new Date(),
           statistics: stats
        });

        const token = jwt.sign(
            {userId: userId},
            process.env.VITE_JWT_SECRET,
            {expiresIn: "12h"}
        );

        res.json({success: true, token: token});
    }
    catch(error) {
        console.error("Error registering user:", error);
        res.status(500).json({error: "Failed to register user"});
    }
});

app.post("/login", async (req, res) => {
    const {username, password} = req.body;

    try {
        const usersRef = db.collection("users");
        const userSnapshot = await usersRef.where("username", "==", username).get();

        if(userSnapshot.empty) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();

        const isMatch = await bcrypt.compare(password, userData.password);
        if(!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
            {userId: userDoc.id},
            process.env.VITE_JWT_SECRET,
            {expiresIn: "12h"}
        );

        await db.collection("users").doc(userDoc.id).update({
            lastLogin: new Date()
        });

        res.json({success: true, token: token});
    }
    catch(error) {
        console.error("Error logging in:", error);
        res.status(500).json({ error: "Failed to log in" });
    }
});

app.post("/create-game", authenticateToken, async (req, res) => {
    const {gameName, playerName, isPrivate, gender} = req.body;
    const playerId = req.user.userId;

    try {
        const gameRef = await db.collection("games").add({
            name: gameName,
            players: [{
                id: playerId,
                name: playerName, 
                role: "Game Master", 
                gender: gender,
                cards: [],
                drinks: 0,
                exen: false,
            }],
            status: "waiting",
            private: isPrivate,
            activePlayer: playerId,
            cards: [],
            drinkCount: 0,
            round: 1,
            lastRound: 0,
            phase: "phase1"
        });

        const gameId = gameRef.id;

        res.json({success: true, gameId: gameId});
    } 
    catch(error) {
        res.json({success: false, error: error.message});    
    }
});

app.post("/join-game/:gameId", authenticateToken, async (req, res) => {
    const {playerName, gender} = req.body;
    const {gameId} = req.params;
    const playerId = req.user.userId;

    try {
        const gameRef = db.collection("games").doc(gameId);
        const gameSnapshot = await gameRef.get();

        if(!gameSnapshot.exists) {
            return res.status(404).json({error: "Game not found"});
        }

        const gameData = gameSnapshot.data();
        if(gameData.status !== "waiting") {
            return res.status(400).json({error: "Game is not joinable"});
        }

        if (gameData.players.some(player => player.id === playerId)) {
            return res.status(400).json({ error: "Player already in game" });
        }

        await db.runTransaction(async (transaction) => {
            transaction.update(gameRef, {
                players: FieldValue.arrayUnion({
                    id: playerId,
                    name: playerName,
                    gender: gender,
                    role: "Player",
                    cards: [],
                    drinks: 0,
                    exen: false
                }),
            });
        });

        res.json({message: "Player joined game"});
    }
    catch(error) {
        console.error("Error joining game:", error);
        res.status(500).json({error: "Failed to join game"});
    }
});

app.post("/kick-player", authenticateToken, async (req, res) => {
    const {gameId, id} = req.body;
    const userId = req.user.userId;

    try {
        const gameRef = db.collection("games").doc(gameId);
        const gameDoc = await gameRef.get();

        if(!gameDoc.exists) {
            return res.status(404).json({ error: "Game not found" });
        }

        const gameData = gameDoc.data();

        if (gameData.players[0].id !== userId) {
            return res.status(403).json({ error: "Only the Game Master can kick players" });
        }

        if (gameData.players[0].id === id) {
            return res.status(403).json({ error: "The Game Master cannot kick himself" });
        }

        const updatedPlayers = gameData.players.filter(player => player.id !== id);

        await gameRef.update({players: updatedPlayers});

        const clients = activeGameConnections.get(gameId) || [];
        clients.forEach(client => {
            if(client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({type: "kicked", id}));
            }
        });

        return res.json({ message: "Player kicked successfully" });
    }
    catch(error) {
        console.error("Error kicking player:", error);
        return res.status(500).json({ error: "Error kicking Player" });
    }
});

app.post("/leave-game", authenticateToken, async (req, res) => {
    const {gameId} = req.body;
    const userId = req.user.userId;

    try {
        const gameRef = db.collection("games").doc(gameId);
        const gameDoc = await gameRef.get();

        if(!gameDoc.exists) {
            return res.status(404).json({ error: "Game not found" });
        }

        const gameData = gameDoc.data();

        if (gameData.players[0].id !== userId) {
            const updatedPlayers = gameData.players.filter(player => player.id !== userId);

            await gameRef.update({players: updatedPlayers});

            return res.json({success: true, message: "one"});
        }

        if (gameData.players[0].id === userId) {
            
            await db.collection("games").doc(gameDoc.id).delete();

            const clients = activeGameConnections.get(gameId) || [];
            clients.forEach(client => {
                if(client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({type: "close", userId}));
                }
            });

            return res.json({success: true, message: "all"});
        }
    }
    catch(error) {
        console.error("Error leaving lobby:", error);
        return res.status(500).json({ error: "Error leaving lobby" });
    }
});

app.post("/start-game", authenticateToken, async (req, res) => {
    const {gameId} = req.body;
    const userId = req.user.userId;

    try {
        const gameRef = db.collection("games").doc(gameId);
        const gameDoc = await gameRef.get();

        if(!gameDoc.exists) {
            return res.status(404).json({ error: "Game not found" });
        }

        const gameData = gameDoc.data();
        const players = gameData.players;

        if (gameData.players[0].id !== userId) {
            return res.status(403).json({ error: "Only the Game Master can start the game" });
        }

        let deck = createDeck();

        const updatedPlayers = players.map((player) => {
            const playerCards = deck.splice(0, 10).map(card => ({...card, played: false}));
            return { ...player, cards: playerCards};
        });

        const pyramid = deck.splice(0,15).map(card => ({...card, flipped: false}));

        await gameRef.update({
            players: updatedPlayers,
            cards: pyramid,
            status: "started",
        });

        const playerIds = players.map(player => player.id);

        for(const id of playerIds) {
            const userRef = db.collection("users").doc(id);
            const userDoc = await userRef.get();

            if(!userDoc.exists) {
                return res.status(404).json({ error: "User not found" });
            }

            const userData = userDoc.data();
            const stats = userData.statistics;
            stats.gamesPlayed++;

            await userRef.update({
                statistics: stats
            });
        }
        
        const clients = activeGameConnections.get(gameId) || [];
        clients.forEach(client => {
            if(client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({type: "start"}));
            }
        });
        
        res.json({message: "Game started successfully"});
    }
    catch(error) {
        console.error("Error starting game:", error);
        return res.status(500).json({ error: "Error starting game" });
    }
});

app.post("/flip-row", authenticateToken, async (req, res) => {
    const { gameId, rowIdx } = req.body;
    const userId = req.user.userId;

    try {
        const gameRef = db.collection("games").doc(gameId);
        const gameDoc = await gameRef.get();

        if (!gameDoc.exists) {
            return res.status(404).json({ error: "Game not found" });
        }

        const gameData = gameDoc.data();
        if (gameData.players[0].id !== userId) {
            return res.status(403).json({ error: "Only the Game Master can flip rows" });
        }

        const currentRound = gameData.round || 1;
        const lastFlippedRound = gameData.lastRound || 0;
        if(currentRound === lastFlippedRound) {
            return res.status(400).json({ error: "You can only flip one row per turn" });
        }
        
        let pyramid = gameData.cards;
        let idx = 0;
        
        if (rowIdx < 1 || rowIdx > 5) {
            return res.status(400).json({ error: "Invalid row ID" });
        }

        for(let i=1; i < rowIdx; i++) {
            idx += i;
        }

        const rowCards = pyramid.slice(idx, idx + rowIdx);

        if(rowCards.every(card => card.flipped)) {
            return res.status(400).json({ error: "This row is already flipped" });
        }

        rowCards.forEach(card => (card.flipped = true));

        await gameRef.update({
            cards: pyramid,
            lastRound: currentRound
        });

        res.json({ message: `Row ${rowIdx} flipped` });
    }
    catch (error) {
        console.error("Error flipping row:", error);
        return res.status(500).json({ error: "Error flipping row" });
    }
});

app.post("/lay-card", authenticateToken, async (req, res) => {
    const { gameId, cardIdx } = req.body;
    const userId = req.user.userId;

    try {
        const gameRef = db.collection("games").doc(gameId);
        const gameDoc = await gameRef.get();

        if (!gameDoc.exists) {
            return res.status(404).json({ error: "Game not found" });
        }

        const gameData = gameDoc.data();
        if (gameData.activePlayer !== userId) {
            return res.status(403).json({ error: "Only the current Player can lay down cards" });
        }

        const players = gameData.players;

        const player = players.findIndex(p => p.id === userId);
        if(player === -1) {
            return res.status(404).json({error: "Player not in game"});
        }

        let pyramid = gameData.cards;
        let idx = 0;
        let rowIdx = gameData.round;

        for(let i=1; i < rowIdx; i++) {
            idx += i;
        }

        const rowCards = pyramid.slice(idx, idx + rowIdx);
        const card = players[player].cards[cardIdx];

        const isInRow = rowCards.some(rCard => rCard.number === card.number);
        let drinks = gameData.drinkCount;

        if(isInRow) {
            players[player].cards[cardIdx].played = true;
            drinks += rowIdx;
        }

        await gameRef.update({
            players: players,
            drinkCount: drinks
        });

        res.json({ message: "Card played!" });
    }
    catch (error) {
        console.error("Error laying card:", error);
        return res.status(500).json({ error: "Error laying card" });
    }
});

app.post("/next-player", authenticateToken, async (req, res) => {
    const { gameId } = req.body;
    const userId = req.user.userId;

    try {
        const gameRef = db.collection("games").doc(gameId);
        const gameDoc = await gameRef.get();

        if (!gameDoc.exists) {
            return res.status(404).json({ error: "Game not found" });
        }

        const gameData = gameDoc.data();
        if (gameData.activePlayer !== userId) {
            return res.status(403).json({ error: "Only the current Player can click next Player" });
        }

        const players = gameData.players;

        const playerIndex = players.findIndex(p => p.id === userId);
        if(playerIndex === -1) {
            return res.status(404).json({error: "Player not in game"});
        }

        let nextPlayerIndex = (playerIndex + 1) % players.length;
        let nextRound = gameData.round;

        if(nextPlayerIndex === 0) {
            if(nextRound < 6) {
                nextRound += 1;
            }
        }

        const userRef = db.collection("users").doc(userId);
        const userDoc = await userRef.get();

        if(!userDoc.exists) {
            return res.status(404).json({ error: "User not found" });
        }

        const userData = userDoc.data();
        const stats = userData.statistics;

        stats.drinksGiven += gameData.drinkCount;
        stats.maxDrinksGiven = (gameData.drinkCount > stats.maxDrinksGiven ? gameData.drinkCount : stats.maxDrinksGiven);

        await userRef.update({
            statistics: stats
        });

        await gameRef.update({
            activePlayer: players[nextPlayerIndex].id,
            round: nextRound,
            drinkCount: 0
        });

        res.json({ message: "Next players turn!" });
    }
    catch (error) {
        console.error("Error updating next player:", error);
        res.status(500).json({ error: "Error updating next player" });
    }
});

app.post("/start-phase2", authenticateToken, async (req, res) => {
    const {gameId} = req.body;
    const userId = req.user.userId;

    try {
        const gameRef = db.collection("games").doc(gameId);
        const gameDoc = await gameRef.get();

        if(!gameDoc.exists) {
            return res.status(404).json({ error: "Game not found" });
        }

        const gameData = gameDoc.data();
        const players = gameData.players;

        if (gameData.players[0].id !== userId) {
            return res.status(403).json({ error: "Only the Game Master can start the next phase" });
        }

        let maxCards = 0;
        let busfahrer = [];

        players.forEach(player => {
            const cards = player.cards.filter(card => !card.played).length;

            if(cards > maxCards) {
                maxCards = cards;
                busfahrer = [player.id];
            } else if (cards === maxCards) {
                busfahrer.push(player.id);
            }
        });

        let phaseCards = [];

        await gameRef.update({ 
            busfahrer,
            drinkCount: 0,
            lastRound: 0,
            round: 1,
            phase: "phase2",
            phaseCards
        });

        const playerIds = players.map(player => player.id);

        for(const id of playerIds) {
            const userRef = db.collection("users").doc(id);
            const userDoc = await userRef.get();

            if(!userDoc.exists) {
                return res.status(404).json({ error: "User not found" });
            }

            const userData = userDoc.data();
            const stats = userData.statistics;

            if(busfahrer.includes(id)) {
                stats.gamesBusfahrer++;
            }

            players.forEach(player => {
                if(player.id === id) {
                    const cardsNmb = player.cards.filter(card => !card.played).length;

                    stats.layedCards += (10-cardsNmb);
                    stats.maxCardsSelf = (cardsNmb > stats.maxCardsSelf ? cardsNmb : stats.maxCardsSelf);
                }
            });

            await userRef.update({
                statistics: stats
            });
        }
        
        
        const clients = activeGameConnections.get(gameId) || [];
        clients.forEach(client => {
            if(client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({type: "phase2"}));
            }
        });

        res.json({ message: "Phase 2 started!", busfahrer });
    } 
    catch (error) {
        console.error("Error starting Phase 2:", error);
        res.status(500).json({ error: "Error starting Phase 2" });
    }
});

app.post("/next-player-phase", authenticateToken, async (req, res) => {
    const { gameId } = req.body;
    const userId = req.user.userId;

    try {
        const gameRef = db.collection("games").doc(gameId);
        const gameDoc = await gameRef.get();

        if (!gameDoc.exists) {
            return res.status(404).json({ error: "Game not found" });
        }

        const gameData = gameDoc.data();
        if (gameData.activePlayer !== userId) {
            return res.status(403).json({ error: "Only the current Player can click next Player" });
        }

        const players = gameData.players;

        const playerIndex = players.findIndex(p => p.id === userId);
        if(playerIndex === -1) {
            return res.status(404).json({error: "Player not in game"});
        }

        let nextPlayerIndex = (playerIndex + 1) % players.length;
        if(gameData.round === 2) {
            nextPlayerIndex = 0;
        }

        let nextRound = gameData.round;

        if(nextPlayerIndex === 0) {
            if(nextRound < 4) {
                nextRound += 1;
            }
        }

        const userRef = db.collection("users").doc(userId);
        const userDoc = await userRef.get();

        if(!userDoc.exists) {
            return res.status(404).json({ error: "User not found" });
        }

        const userData = userDoc.data();
        const stats = userData.statistics;

        if(gameData.round === 1) {
            stats.drinksSelf += gameData.drinkCount;
            stats.maxDrinksSelf = (gameData.drinkCount > stats.maxDrinksSelf ? gameData.drinkCount : stats.maxDrinksSelf);
        }

        if(gameData.round === 3) {
            const player = gameDoc.data().players.find(p => p.id === userId);
            if(!player) return res.status(404).json({error: "Player not in game"});

            if(player.exen) {
                stats.numberEx++;
            }
        }

        await userRef.update({
            statistics: stats
        });

        await gameRef.update({
            activePlayer: players[nextPlayerIndex].id,
            round: nextRound,
            drinkCount: 0
        });

        res.json({ message: "Next players turn!" });
    }
    catch (error) {
        console.error("Error updating next player:", error);
        res.status(500).json({ error: "Error updating next player" });
    }
});

app.post("/lay-card-phase", authenticateToken, async (req, res) => {
    const { gameId, cardIdx } = req.body;
    const userId = req.user.userId;

    try {
        const gameRef = db.collection("games").doc(gameId);
        const gameDoc = await gameRef.get();

        if (!gameDoc.exists) {
            return res.status(404).json({ error: "Game not found" });
        }

        const gameData = gameDoc.data();

        if(gameData.round !== 2) {
            if (gameData.activePlayer !== userId) {
                return res.status(403).json({ error: "Only the current Player can lay down cards" });
            }
        }

        const players = gameData.players;

        const playerId = players.findIndex(p => p.id === userId);
        if(playerId === -1) {
            return res.status(404).json({error: "Player not in game"});
        }

        const rIdx = gameData.round;
        const player = players[playerId]; 
        const card = player.cards[cardIdx];

        if (rIdx === 1 && (card.number < 2 || card.number > 10)) {
            return res.status(400).json({ error: "Only cards with numbers 2-10 can be played in round 1" });
        }

        if (rIdx === 2 && (card.number < 11 || card.number > 13)) {
            return res.status(400).json({ error: "Only J, Q, K can be played in round 2" });
        }

        if (rIdx === 3 && (card.number !== 14)) {
            return res.status(400).json({ error: "Only A can be played in round 3" });
        }

        const phaseCards = gameData.phaseCards || [];
        let roundCards = [];
        if(phaseCards.length > 0) {
            if(phaseCards.length >= rIdx) {
                roundCards = phaseCards[rIdx-1];
            } else {
                roundCards = {cards: []};
            }
        } else {
            roundCards = {cards: []};
        }

        roundCards.cards.unshift(card);

        players[playerId].cards[cardIdx].played = true;

        if(phaseCards.length >= rIdx) {
            phaseCards[rIdx-1] = roundCards;
        } else {
            phaseCards.push(roundCards);
        }

        if(rIdx === 1) {
            const drinks = gameData.drinkCount + card.number;

            await gameRef.update({
                phaseCards: phaseCards,
                players: players,
                drinkCount: drinks
            });

            res.json({ message: "Card played!" });
        }

        if(rIdx === 2) {

            players.forEach(p=> checkFaceCard(p, card));

            await gameRef.update({
                phaseCards: phaseCards,
                players: players
            });

            res.json({ message: "Card played!" });
        }

        if(rIdx === 3) {

            players[playerId].exen = true;

            await gameRef.update({
                phaseCards: phaseCards,
                players: players
            });

            res.json({ message: "Card played!" });
        }
    }
    catch (error) {
        console.error("Error laying card:", error);
        return res.status(500).json({ error: "Error laying card" });
    }
});

app.post("/start-phase3", authenticateToken, async (req, res) => {
    const {gameId} = req.body;
    const userId = req.user.userId;

    try {
        const gameRef = db.collection("games").doc(gameId);
        const gameDoc = await gameRef.get();

        if(!gameDoc.exists) {
            return res.status(404).json({ error: "Game not found" });
        }

        const gameData = gameDoc.data();
        const players = gameData.players;

        if (gameData.players[0].id !== userId) {
            return res.status(403).json({ error: "Only the Game Master can start the next phase" });
        }

        let deck = createDeck();

        const diamond = deck.splice(0,27).map(card => ({...card, flipped: false}));
        diamond[0].flipped = true;
        diamond[26].flipped = true;

        const lastCard = diamond[26];

        const endGame = false;

        await gameRef.update({ 
            cards: diamond,
            drinkCount: 0,
            lastRound: 0,
            round: 9,
            phase: "phase3",
            lastCard,
            endGame
        });
        
        const clients = activeGameConnections.get(gameId) || [];
        clients.forEach(client => {
            if(client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({type: "phase3"}));
            }
        });

        res.json({ message: "Phase 3 started!" });
    } 
    catch (error) {
        console.error("Error starting Phase 3:", error);
        res.status(500).json({ error: "Error starting Phase 3" });
    }
});

app.post("/retry-phase", authenticateToken, async (req, res) => {
    const {gameId} = req.body;
    const userId = req.user.userId;

    try {
        const gameRef = db.collection("games").doc(gameId);
        const gameDoc = await gameRef.get();

        if(!gameDoc.exists) {
            return res.status(404).json({ error: "Game not found" });
        }

        const gameData = gameDoc.data();

        let deck = createDeck();

        const diamond = deck.splice(0,27).map(card => ({...card, flipped: false}));
        diamond[0].flipped = true;
        diamond[26].flipped = true;

        const endGame = false;

        const lCard = diamond[26];

        await gameRef.update({ 
            cards: diamond,
            drinkCount: 0,
            lastRound: 0,
            round: 9,
            lastCard: lCard,
            endGame
        });

        res.json({ message: "Phase 3 retry!" });
    } 
    catch (error) {
        console.error("Error retrying Phase 3:", error);
        res.status(500).json({ error: "Error retrying Phase 3" });
    }
});

app.post("/check-card", authenticateToken, async (req, res) => {
    const {gameId, cardIdx, btnType} = req.body;
    const userId = req.user.userId;

    try {
        const gameRef = db.collection("games").doc(gameId);
        const gameDoc = await gameRef.get();

        if(!gameDoc.exists) {
            return res.status(404).json({ error: "Game not found" });
        }

        const gameData = gameDoc.data();

        const gameCards = gameData.cards;
        if(gameCards.length < cardIdx || cardIdx < 0) {
            return res.status(404).json({ error: "Card Idx is wrong" });
        }

        const card = gameCards[cardIdx];
        let lCard = gameData.lastCard;

        let validCard = false;

        if(btnType === "equal") {
            validCard = (card.type === lCard.type) || (card.number === lCard.number);
        }

        if(btnType === "unequal") {
            validCard = (card.type !== lCard.type && card.number !== lCard.number);
        }

        if(btnType === "same") {
            validCard = (card.number === lCard.number);
        }

        if(btnType === "lower") {
            validCard = (card.number < lCard.number);
        }

        if(btnType === "higher") {
            validCard = (card.number > lCard.number);
        }

        gameCards[cardIdx].flipped = true;
        const drinks = gameData.drinkCount + 1;


        if(validCard) {

            lCard = card;

            const nextRound = gameData.round - 1;

            await gameRef.update({ 
                cards: gameCards,
                round: nextRound,
                drinkCount: drinks,
                lastCard: lCard
            });

            res.json({ message: "Correct Card" });
        } else {

            const nextRound = -1;
            const lRound = 1;

            await gameRef.update({ 
                cards: gameCards,
                round: nextRound,
                drinkCount: drinks,
                lastRound: lRound
            });
        }
    }
    catch (error) {
        console.error("Error Checking Card in Phase 3:", error);
        res.status(500).json({ error: "Error Checking Card in Phase 3" });
    }
});

app.post("/check-last-card", authenticateToken, async (req, res) => {
    const {gameId, cardIdx, btnType, lastType} = req.body;
    const userId = req.user.userId;

    try {
        const gameRef = db.collection("games").doc(gameId);
        const gameDoc = await gameRef.get();

        if(!gameDoc.exists) {
            return res.status(404).json({ error: "Game not found" });
        }

        const gameData = gameDoc.data();

        const gameCards = gameData.cards;
        if(gameCards.length < cardIdx || cardIdx < 0) {
            return res.status(404).json({ error: "Card Idx is wrong" });
        }

        const card = gameCards[cardIdx];
        let lCard = gameData.lastCard;
        let eCard = gameData.cards[0];

        let validCard = false;

        if(btnType === "equal") {
            validCard = card.type === eCard.type;
        }

        if(btnType === "unequal") {
            validCard = (card.type !== eCard.type && card.number !== eCard.number);
        }

        if(lastType === "same") {
            validCard = (card.number === lCard.number);
        }

        if(lastType === "lower") {
            validCard = (card.number < lCard.number);
        }

        if(lastType === "higher") {
            validCard = (card.number > lCard.number);
        }

        gameCards[cardIdx].flipped = true;
        const drinks = gameData.drinkCount + 1;


        if(validCard) {

            lCard = card;

            const nextRound = gameData.round - 1;

            await gameRef.update({ 
                cards: gameCards,
                round: nextRound,
                drinkCount: drinks,
                lastCard: lCard,
                endGame: true
            });

            res.json({ message: "Correct Card" });
        } else {

            const nextRound = -1;
            const lRound = 1;

            await gameRef.update({ 
                cards: gameCards,
                round: nextRound,
                drinkCount: drinks,
                lastRound: lRound
            });
        }
    }
    catch (error) {
        console.error("Error Checking Card in Phase 3:", error);
        res.status(500).json({ error: "Error Checking Card in Phase 3" });
    }
});

app.post("/open-new-game", authenticateToken, async (req,res) => {
    const {gameId} = req.body;
    const userId = req.user.userId;

    try {
        const lgameRef = db.collection("games").doc(gameId);
        const gameDoc = await lgameRef.get();

        if(!gameDoc.exists) {
            return res.status(404).json({ error: "Game not found" });
        }

        const lData = gameDoc.data();

        const players = lData.players;

        players.forEach(player => {
            player.cards = [];
            player.drinks = 0;
            player.exen = false;
        });

        const gameRef = await db.collection("games").add({
            name: lData.name,
            players: players,
            status: "waiting",
            private: lData.private,
            activePlayer: lData.activePlayer,
            cards: [],
            drinkCount: 0,
            round: 1,
            lastRound: 0,
            phase: "phase1"
        });

        const newId = gameRef.id;

        const clients = activeGameConnections.get(gameId) || [];
        clients.forEach(client => {
            if(client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({type: "newGame", newId}));
            }
        });
    }
    catch (error) {
        console.error("Error Opening new game:", error);
        res.status(500).json({ error: "Error Opening new game" });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://167.86.102.204:${port}`);
});
