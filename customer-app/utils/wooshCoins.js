export const formatWooshCoins = (amount) => {
  const n = Number(amount) || 0;
  if (Number.isInteger(n) || Math.abs(n - Math.round(n)) < 0.001) {
    return String(Math.round(n));
  }
  return n.toFixed(2);
};

export const wooshCoinsLabel = (amount) => {
  const value = formatWooshCoins(amount);
  const unit = Number(value) === 1 ? 'Woosh Coin' : 'Woosh Coins';
  return `${value} ${unit}`;
};
