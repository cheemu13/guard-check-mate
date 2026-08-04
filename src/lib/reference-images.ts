// Auto-generated from the supplied guard reference image set.
import img0 from "@/assets/reference/blue-shirt-fail-faded-shirt.jpg.asset.json";
import img1 from "@/assets/reference/blue-shirt-fail-shirt-not-tucked-in-2-and-not-worn-properly3.jpg.asset.json";
import img2 from "@/assets/reference/blue-shirt-fail-shirt-sleeve-folded-and-collar-not-worn-properly.jpg.asset.json";
import img3 from "@/assets/reference/blue-shirt-fail-shirt-not-tucked-in-and-not-worn-properly-1.jpg.asset.json";
import img4 from "@/assets/reference/blue-shirt-fail-shirt-not-tucked-in-and-not-worn-properly2.jpg.asset.json";
import img5 from "@/assets/reference/blue-shirt-pass-blue-trouser-worn-properly.jpg.asset.json";
import img6 from "@/assets/reference/blue-shirt-pass-clean-no-stains-no-tears-on-shirt.jpg.asset.json";
import img7 from "@/assets/reference/blue-shirt-pass-blue-shirt-worn-properly-1.jpg.asset.json";
import img8 from "@/assets/reference/cap-fail-cap-missing.jpg.asset.json";
import img9 from "@/assets/reference/cap-fail-cap-not-worn-properly.jpg.asset.json";
import img10 from "@/assets/reference/cap-pass-blue-cap-worn-porperly.jpg.asset.json";
import img11 from "@/assets/reference/collar-fail-collar-not-worn-properly-and-not-folded.jpg.asset.json";
import img12 from "@/assets/reference/collar-pass-collar-folded-properly-1.jpg.asset.json";
import img13 from "@/assets/reference/collar-pass-collar-folded-properly-2.jpg.asset.json";
import img14 from "@/assets/reference/id-card-fail-id-card-worn-backside.jpg.asset.json";
import img15 from "@/assets/reference/id-card-fail-missing-id-card.jpg.asset.json";
import img16 from "@/assets/reference/id-card-pass-id-card-lanyard-1.jpg.asset.json";
import img17 from "@/assets/reference/whole-uniform-fail-whole-uniform-front-view.jpg.asset.json";
import img18 from "@/assets/reference/whole-uniform-pass-whole-uniform-front-view1.jpg.asset.json";
import img19 from "@/assets/reference/whole-uniform-pass-whole-uniform-back-view.jpg.asset.json";
import img20 from "@/assets/reference/whole-uniform-pass-whole-uniform-side-view.jpg.asset.json";
import img21 from "@/assets/reference/accessory-on-body-fail-accessory-not-allowed-on-hand-1.jpg.asset.json";
import img22 from "@/assets/reference/accessory-on-body-fail-accessory-not-allowed-on-hand-2.jpg.asset.json";
import img23 from "@/assets/reference/black-belt-fail-missing-belt.jpg.asset.json";
import img24 from "@/assets/reference/black-belt-pass-blackbelt-with-metal-buckle-worn-properly-1.jpg.asset.json";
import img25 from "@/assets/reference/black-shoes-fail-dirty-shoes.jpg.asset.json";
import img26 from "@/assets/reference/black-shoes-fail-wrong-shoes-without-lacees.jpg.asset.json";
import img27 from "@/assets/reference/black-shoes-fail-wrong-shoes-not-formal-1.jpg.asset.json";
import img28 from "@/assets/reference/black-shoes-fail-wrong-shoes-not-formal-2.jpg.asset.json";
import img29 from "@/assets/reference/black-shoes-pass-black-shoes-formal-and-polished-1.jpg.asset.json";
import img30 from "@/assets/reference/black-shoes-pass-black-shoes-formal-and-polished-2.jpg.asset.json";
import img31 from "@/assets/reference/black-socks-fail-wrong-colour-socks.jpg.asset.json";
import img32 from "@/assets/reference/black-socks-fail-socks-below-ankle-length.jpg.asset.json";
import img33 from "@/assets/reference/black-socks-fail-wrong-colour-socks-not-black.jpg.asset.json";
import img34 from "@/assets/reference/black-socks-pass-black-socks-worn-properly.jpg.asset.json";
import img35 from "@/assets/reference/sleeve-badge-fail-missing-side-sleeve-badge.jpg.asset.json";
import img36 from "@/assets/reference/sleeve-badge-pass-side-sleeve-badge-2.jpg.asset.json";
import img37 from "@/assets/reference/sleeve-badge-pass-front-chest-badge.jpg.asset.json";
import img38 from "@/assets/reference/sleeve-badge-pass-side-sleeve-badge-1.jpg.asset.json";

export interface ReferenceExample { url: string; verdict: "pass" | "fail"; label: string }
export interface ReferenceGroup { category: string; examples: ReferenceExample[] }

export const REFERENCE_GROUPS: ReferenceGroup[] = [
  {
    category: "Blue Shirt",
    examples: [
      { url: img0.url, verdict: "fail", label: "Faded shirt" },
      { url: img1.url, verdict: "fail", label: "Shirt Not tucked in 2 and not worn properly3" },
      { url: img2.url, verdict: "fail", label: "Shirt Sleeve folded and collar not worn properly" },
      { url: img3.url, verdict: "fail", label: "Shirt not tucked in and not worn properly 1" },
      { url: img4.url, verdict: "fail", label: "Shirt not tucked in and not worn properly2" },
      { url: img5.url, verdict: "pass", label: "Blue trouser worn properly" },
      { url: img6.url, verdict: "pass", label: "Clean, no stains, no tears on shirt" },
      { url: img7.url, verdict: "pass", label: "blue shirt worn properly 1" },
    ],
  },
  {
    category: "Cap",
    examples: [
      { url: img8.url, verdict: "fail", label: "Cap missing" },
      { url: img9.url, verdict: "fail", label: "Cap not worn properly" },
      { url: img10.url, verdict: "pass", label: "blue cap worn porperly" },
    ],
  },
  {
    category: "Collar",
    examples: [
      { url: img11.url, verdict: "fail", label: "Collar not worn properly and not folded" },
      { url: img12.url, verdict: "pass", label: "Collar folded properly 1" },
      { url: img13.url, verdict: "pass", label: "Collar folded properly 2" },
    ],
  },
  {
    category: "Id Card",
    examples: [
      { url: img14.url, verdict: "fail", label: "id card_worn backside" },
      { url: img15.url, verdict: "fail", label: "missing ID Card" },
      { url: img16.url, verdict: "pass", label: "Id card lanyard 1" },
    ],
  },
  {
    category: "Whole Uniform",
    examples: [
      { url: img17.url, verdict: "fail", label: "Whole uniform front view" },
      { url: img18.url, verdict: "pass", label: "Whole Uniform front view1" },
      { url: img19.url, verdict: "pass", label: "whole uniform back view" },
      { url: img20.url, verdict: "pass", label: "whole uniform side view" },
    ],
  },
  {
    category: "Accessory On Body",
    examples: [
      { url: img21.url, verdict: "fail", label: "accessory not allowed on hand 1" },
      { url: img22.url, verdict: "fail", label: "accessory not allowed on hand 2" },
    ],
  },
  {
    category: "Black Belt",
    examples: [
      { url: img23.url, verdict: "fail", label: "missing Belt" },
      { url: img24.url, verdict: "pass", label: "Blackbelt with metal buckle worn properly 1" },
    ],
  },
  {
    category: "Black Shoes",
    examples: [
      { url: img25.url, verdict: "fail", label: "Dirty Shoes" },
      { url: img26.url, verdict: "fail", label: "Wrong shoes without lacees" },
      { url: img27.url, verdict: "fail", label: "wrong shoes not formal 1" },
      { url: img28.url, verdict: "fail", label: "wrong shoes not formal 2" },
      { url: img29.url, verdict: "pass", label: "Black Shoes formal and polished 1" },
      { url: img30.url, verdict: "pass", label: "Black shoes formal and polished 2" },
    ],
  },
  {
    category: "Black Socks",
    examples: [
      { url: img31.url, verdict: "fail", label: "Wrong colour socks" },
      { url: img32.url, verdict: "fail", label: "Socks below ankle length" },
      { url: img33.url, verdict: "fail", label: "Wrong colour socks not black" },
      { url: img34.url, verdict: "pass", label: "Black socks worn properly" },
    ],
  },
  {
    category: "Sleeve Badge",
    examples: [
      { url: img35.url, verdict: "fail", label: "Missing side sleeve badge" },
      { url: img36.url, verdict: "pass", label: "side sleeve badge 2" },
      { url: img37.url, verdict: "pass", label: "Front chest badge" },
      { url: img38.url, verdict: "pass", label: "Side sleeve badge 1" },
    ],
  },
];
