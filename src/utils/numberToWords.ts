/**
 * Converts a numeric amount into words in Bangladeshi Taka & Paisa.
 * Supports South Asian numbering system (Crore, Lakh, Thousand, Hundred).
 */
export function numberToWords(num: number | string): string {
  if (num === "" || num === null || num === undefined) return "";
  const n = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(n) || n < 0) return "";
  if (n === 0) return "Zero Taka Only";

  const single = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const convertTwoDigits = (val: number): string => {
    if (val < 20) return single[val];
    const ten = Math.floor(val / 10);
    const rem = val % 10;
    return (tens[ten] + (rem > 0 ? " " + single[rem] : "")).trim();
  };

  const convertThreeDigits = (val: number): string => {
    const hundred = Math.floor(val / 100);
    const rem = val % 100;
    let str = "";
    if (hundred > 0) {
      str += single[hundred] + " Hundred";
    }
    if (rem > 0) {
      str += (str ? " " : "") + convertTwoDigits(rem);
    }
    return str.trim();
  };

  // Split into taka and paisa
  const taka = Math.floor(n);
  const paisa = Math.round((n - taka) * 100);

  let takaWords = "";

  if (taka === 0) {
    takaWords = "Zero Taka";
  } else {
    let temp = taka;

    const crore = Math.floor(temp / 10000000);
    temp %= 10000000;

    const lakh = Math.floor(temp / 100000);
    temp %= 100000;

    const thousand = Math.floor(temp / 1000);
    temp %= 1000;

    const hundredRem = temp;

    const parts: string[] = [];

    if (crore > 0) {
      parts.push(convertThreeDigits(crore) + " Crore");
    }
    if (lakh > 0) {
      parts.push(convertTwoDigits(lakh) + " Lakh");
    }
    if (thousand > 0) {
      parts.push(convertTwoDigits(thousand) + " Thousand");
    }
    if (hundredRem > 0) {
      parts.push(convertThreeDigits(hundredRem));
    }

    takaWords = parts.join(" ") + " Taka";
  }

  let paisaWords = "";
  if (paisa > 0) {
    paisaWords = " and " + convertTwoDigits(paisa) + " Paisa";
  }

  return (takaWords + paisaWords + " Only").replace(/\s+/g, " ").trim();
}
