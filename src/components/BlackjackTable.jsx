import { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import { doc, updateDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import "../styles/BlackjackTable.css";

const CARD_BACK_URL = "https://deckofcardsapi.com/static/img/back.png";
const CARD_IMG = (code) => `https://deckofcardsapi.com/static/img/${code}.png`;

function generateDeck() {
  const suits = ["S", "H", "D", "C"];
  const ranks = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "0",
    "J",
    "Q",
    "K",
  ];
  const deck = [];
  for (let s of suits) {
    for (let r of ranks) {
      deck.push(r + s);
    }
  }
  return deck.sort(() => Math.random() - 0.5);
}

function getCardValue(code) {
  const rank = code.slice(0, -1);
  if (["K", "Q", "J", "0"].includes(rank)) return 10;
  if (rank === "A") return 11;
  return parseInt(rank);
}

function calculatePoints(cards) {
  let sum = 0;
  let aces = 0;
  for (let card of cards) {
    if (card.code === "back") continue;
    const value = getCardValue(card.code);
    if (value === 11) aces++;
    sum += value;
  }
  while (sum > 21 && aces > 0) {
    sum -= 10;
    aces--;
  }
  return sum;
}

function preloadDeckImages() {
  const suits = ["S", "H", "D", "C"];
  const ranks = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "0",
    "J",
    "Q",
    "K",
  ];
  for (let s of suits) {
    for (let r of ranks) {
      const img = new Image();
      img.src = `https://deckofcardsapi.com/static/img/${r + s}.png`;
    }
  }
  const back = new Image();
  back.src = CARD_BACK_URL;
}

const applyWinnings = async (amount, balance, setBalance, currentUser) => {
  const userRef = doc(db, "users", currentUser.uid);
  const newBalance = balance + amount;
  await updateDoc(userRef, {
    balance: newBalance,
    activeBet: 0,
  });
  setBalance(newBalance);
};


export default function BlackjackTable() {
  const [deck, setDeck] = useState([]);
  const [playerCards, setPlayerCards] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);
  const [bet, setBet] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [message, setMessage] = useState("");
  const [showActions, setShowActions] = useState(false);
  const { balance, setBalance, currentUser } = useAuth();

  useEffect(() => {
    preloadDeckImages();
  }, []);

  const startGame = async () => {
    if (bet < 1 || bet > 500) {
      alert("Your bet must be between $1 and $500.");
      return;
    }

    if (bet > balance) {
      alert("You don't have enough balance to place this bet.");
      return;
    }

    await updateDoc(doc(db, "users", currentUser.uid), {
      balance: balance - bet,
      activeBet: bet,
    });

    setBalance((prev) => prev - bet);

    const newDeck = generateDeck();
    const [p1, d1, p2, d2] = [
      newDeck.pop(),
      newDeck.pop(),
      newDeck.pop(),
      newDeck.pop(),
    ];
    setPlayerCards([]);
    setDealerCards([]);
    setDeck(newDeck);
    setGameStarted(true);
    setShowActions(false);
    setMessage("");

    setTimeout(() => setPlayerCards([{ code: p1, offset: false }]), 600);
    setTimeout(() => setDealerCards([{ code: d1, offset: false }]), 1200);
    setTimeout(
      () => setPlayerCards((prev) => [...prev, { code: p2, offset: true }]),
      1800
    );
    setTimeout(
      () =>
        setDealerCards((prev) => [
          ...prev,
          { code: "back", offset: true, hiddenCard: d2 },
        ]),
      2400
    );
    setTimeout(async () => {
      const dealerHasBlackjack =
        (getCardValue(d1) === 11 && getCardValue(d2) === 10) ||
        (getCardValue(d1) === 10 && getCardValue(d2) === 11);

      const playerHasBlackjack =
        (getCardValue(p1) === 11 && getCardValue(p2) === 10) ||
        (getCardValue(p1) === 10 && getCardValue(p2) === 11);

      if (dealerHasBlackjack && !playerHasBlackjack) {
        setDealerCards([
          { code: d1, offset: false },
          { code: d2, offset: true },
        ]);
        setMessage("Dealer has Blackjack! You Lose.");
        await updateDoc(doc(db, "users", currentUser.uid), { activeBet: 0 });
      } else if (dealerHasBlackjack && playerHasBlackjack) {
        setDealerCards([
          { code: d1, offset: false },
          { code: d2, offset: true },
        ]);
        setMessage("Both have Blackjack! Push.");
        await applyWinnings(bet, balance, setBalance, currentUser);
      } else if (playerHasBlackjack && !dealerHasBlackjack) {
        setDealerCards([
          { code: d1, offset: false },
          { code: d2, offset: true },
        ]);
        setMessage("Player has Blackjack! You win.");
        await applyWinnings(bet * 2.5, balance, setBalance, currentUser);
      } else {
        setShowActions(true);
      }
    }, 2600);
  };

  const hit = () => {
    if (deck.length === 0) return;

    setShowActions(false);

    const nextCard = deck[deck.length - 1];
    const updatedDeck = deck.slice(0, -1);

    setTimeout(async () => {
      const newCard = { code: nextCard, offset: true };
      const updatedPlayer = [...playerCards, newCard];

      setPlayerCards(updatedPlayer);
      setDeck(updatedDeck);

      const newPoints = calculatePoints(updatedPlayer);
      if (newPoints > 21) {
        setMessage("You Busted!");
        await updateDoc(doc(db, "users", currentUser.uid), { activeBet: 0 });
      } else {
        setShowActions(true);
      }
    }, 600);
  };

  const stand = () => {
    setShowActions(false);
    const newDealerCards = [...dealerCards];
    const hidden = newDealerCards.find((c) => c.code === "back");

    if (hidden) {
      setTimeout(() => {
        hidden.code = hidden.hiddenCard;
        delete hidden.hiddenCard;
        setDealerCards([...newDealerCards]);
      }, 500);
    }

    let tempDeck = [...deck];
    let dealerHand = [...newDealerCards];

    const drawDealerCard = (index = 0) => {
      const dealerPoints = calculatePoints(dealerHand);
      if (dealerPoints >= 17 || tempDeck.length === 0) {
        setTimeout(async () => {
          const playerPoints = calculatePoints(playerCards);
          const finalDealerPoints = calculatePoints(dealerHand);

          let result = "";
          if (playerPoints > 21) {
            result = "You Busted!";
          } else if (finalDealerPoints > 21) {
            result = "Dealer Busted — You Win!";
            await applyWinnings(bet * 2, balance, setBalance, currentUser);
          } else if (playerPoints > finalDealerPoints) {
            result = "You Win!";
            await applyWinnings(bet * 2, balance, setBalance, currentUser);
          } else if (playerPoints < finalDealerPoints) {
            result = "You Lose!";
          } else {
            result = "Push! (Draw)";
            await applyWinnings(bet * 2, balance, setBalance, currentUser);
          }

          setMessage(result);
          await updateDoc(doc(db, "users", currentUser.uid), { activeBet: 0 });
        }, 700);
        return;
      }

      const nextCard = tempDeck.pop();
      dealerHand.push({ code: nextCard, offset: true });
      setDealerCards([...dealerHand]);
      setDeck([...tempDeck]);

      setTimeout(() => drawDealerCard(index + 1), 700);
    };

    setTimeout(() => drawDealerCard(), 1000);
  };

  const renderCards = (owner, cards) => {
    const totalPoints = calculatePoints(cards);
    return (
      <div className={`card-group ${owner}`}>
        {owner === "dealer" && (
          <div className="points-label dealer-label">
            Dealer <span className="points-circle">{totalPoints}</span>
          </div>
        )}
        <div className={`card-row ${owner}`}>
          {cards.map((card, idx) => {
            const offsetStyle = {
              position: "relative",
              ...(owner === "player" &&
                card.offset && { top: `-${idx * 16}px` }),
              ...(card.rotated && { transform: "rotate(90deg)" }),
            };

            return (
              <img
                key={idx}
                src={card.code === "back" ? CARD_BACK_URL : CARD_IMG(card.code)}
                alt={card.code}
                className={`card-image fade-in`}
                style={offsetStyle}
              />
            );
          })}
        </div>
        {owner === "player" && (
          <div className="points-label player-label">
            Player <span className="points-circle">{totalPoints}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="blackjack-background">
      {!gameStarted && (
        <div className="text-center d-flex flex-column align-items-center">
          <h2
            className="mb-5"
            style={{ fontWeight: "bold", color: "#fff", fontSize: "2.2rem" }}
          >
            Place Your Bet: <span style={{ color: "#00ffcc" }}>${bet}</span>
          </h2>
          <div className="d-flex justify-content-center gap-5 flex-wrap mb-5">
            {[1, 5, 25, 100].map((value, idx) => (
              <div
                key={idx}
                onClick={() => {
                  const total = bet + value;
                  if (total <= 500) setBet(total);
                }}
                style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  backgroundColor: ["#2ecc71", "#3498db", "#e74c3c", "#34495e"][
                    idx
                  ],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: "24px",
                  cursor: "pointer",
                  boxShadow: "0 0 20px #ff00ff",
                  transition: "transform 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.transform = "scale(1.1)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.transform = "scale(1.0)")
                }
              >
                ${value}
              </div>
            ))}
          </div>
          <Button className="glow-button" onClick={startGame}>
            Start Game
          </Button>
        </div>
      )}

      {gameStarted && (
        <>
          {renderCards("dealer", dealerCards)}
          {renderCards("player", playerCards)}

          {showActions && (
            <div className="action-buttons">
              <Button className="glow-button" onClick={hit}>
                Hit
              </Button>
              <Button className="glow-button" onClick={stand}>
                Stand
              </Button>
            </div>
          )}

          {message && (
            <h3
              className="text-center mt-4"
              style={{ color: "#fff", textShadow: "0 0 10px #00ffcc" }}
            >
              {message && <div className="game-message">{message}</div>}
            </h3>
          )}
        </>
      )}
    </div>
  );
}
