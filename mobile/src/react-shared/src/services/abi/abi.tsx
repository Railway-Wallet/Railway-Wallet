import ABI_ERC20 from "./json/erc20.json";
import ABI_ERC721 from "./json/erc721.json";
import ABI_ERC1155 from "./json/erc1155.json";
import ABI_TEST_ERC20 from "./json/testERC20.json";

export const abi = {
  erc20: ABI_ERC20,
  erc721: ABI_ERC721,
  erc1155: ABI_ERC1155,
  mintableTestERC20: ABI_TEST_ERC20,
} as const;
