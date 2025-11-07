/**
 * @fileoverview Utility functions for creating and shuffling decks of cards.
 */

/**
 * Creates a standard deck of 52 playing cards (2-14 in hearts, diamonds, clubs, spades),
 * duplicated to make 104 cards, and shuffles it using the specified algorithm.
 * @function createDeck
 * @param {string} type - The type of shuffle to use ('Fisher-Yates', 'Caotic', 'Riffle').
 * @returns {Array} - The shuffled deck of cards.
 */
export function createDeck(type) {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const values = Array.from({ length: 13 }, (_, i) => i + 2);
    let deck = [];

    for (let i = 0; i < 2; i++) {
        suits.forEach((suit) => {
            values.forEach((value) => {
                deck.push({ number: value, type: suit });
            });
        });
    }

    return shuffleDeck(deck, type);
}

/**
 * Shuffles a deck of cards using the specified algorithm.
 * @function shuffleDeck
 * @param {Array} deck - The deck of cards to shuffle.
 * @param {string} type - The type of shuffle to use ('Fisher-Yates', 'Caotic', 'Riffle').
 * @returns {Array} - The shuffled deck of cards.
 */
function shuffleDeck(deck, type) {
    switch (type) {
        case 'Fisher-Yates':
            return fisherYatesShuffle(deck);
        case 'Caotic':
            return caoticShuffle(deck);
        case 'Riffle':
            return riffleShuffle(deck);
    }

    return deck;
}

/**
 * Shuffles a deck of cards using the Fisher-Yates algorithm.
 * @function fisherYatesShuffle
 * @param {Array} deck - The deck of cards to shuffle.
 * @returns {Array} - The shuffled deck of cards.
 */
function fisherYatesShuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

/**
 * Shuffles a deck of cards using a custom "Caotic" algorithm that favors streaks.
 * @function caoticShuffle
 * @param {Array} deck - The deck of cards to shuffle.
 * @returns {Array} - The shuffled deck of cards.
 */
function caoticShuffle(deck) {
    const original = [...deck];
    deck.length = 0;

    while (original.length > 0) {
        let index;

        // Favor pulling the last added card again (streaks)
        if (deck.length > 0 && Math.random() < 0.3) {
            const last = deck[deck.length - 1];
            const similarIndexes = original
                .map((card, idx) =>
                    card.number === last.number || card.type === last.type
                        ? idx
                        : -1,
                )
                .filter((idx) => idx !== -1);

            if (similarIndexes.length > 0) {
                index =
                    similarIndexes[
                    Math.floor(Math.random() * similarIndexes.length)
                    ];
            } else {
                index = Math.floor(Math.random() * original.length);
            }
        } else {
            index = Math.floor(Math.random() * original.length);
        }

        const [card] = original.splice(index, 1);
        deck.push(card);
    }

    return deck;
}

/**
 * Shuffles a deck of cards using the Riffle shuffle algorithm.
 * @function riffleShuffle
 * @param {Array} deck - The deck of cards to shuffle.
 * @returns {Array} - The shuffled deck of cards.
 */
function riffleShuffle(deck) {
    for (let i = 0; i < 7; i++) {
        const cutPoint = Math.floor(deck.length / 2 + (Math.random() * 10 - 5));
        const left = deck.slice(0, cutPoint);
        const right = deck.slice(cutPoint);

        const shuffled = [];
        while (left.length > 0 || right.length > 0) {
            // pick from left or right with 50/50 chance
            if (left.length && (Math.random() < 0.5 || right.length === 0)) {
                shuffled.push(left.shift());
            } else {
                shuffled.push(right.shift());
            }
        }
        deck = shuffled;
    }

    return deck;
}

/**
 * Checks if two cards match based on the specified match style.
 * @function checkCardMatch
 * @param {Object} cardA - The first card to compare.
 * @param {Object} cardB - The second card to compare.
 * @param {string} matchStyle - The match style ('Exact', 'Type-only', 'Number-only').
 * @returns {boolean} - True if the cards match based on the match style, false otherwise.
 */
export function checkCardMatch(cardA, cardB, matchStyle) {
    switch (matchStyle) {
        case 'Exact':
            return (
                cardA.number === cardB.number &&
                cardA.type === cardB.type
            );
        case 'Type-only':
            return cardA.type === cardB.type;
        case 'Number-only':
        default:
            return cardA.number === cardB.number;
    }
}