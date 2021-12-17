const ethers = require('ethers');

const addresses = {
  WBNB: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
  factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
  router: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
  recipient: 'address'
}


const tokens = {
  TOB: '0xccb1262ffab6374f1de25ffe7ec8df2818c3c7d4',
  BUSD: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
  SCZ: '0x39f1014a88c8ec087cedf1bfc7064d24f507b894',
  DOP: '0x844fa82f1e54824655470970f7004dd90546bb28',
  WOLF: '0x8c5921a9563e6d5dda95cb46b572bb1cc9b04a27',
  WBNB: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
  MAT: '0xd4cc9538bbd3eda848da2292c0e383835703f138'
};

//First address of this mnemonic must have enough BNB to pay for tx fess
const mnemonic = 'mnemic';

const provider = new ethers.providers.WebSocketProvider('url socket');
const wallet = ethers.Wallet.fromMnemonic(mnemonic);
const account = wallet.connect(provider);

const factory = new ethers.Contract(
  addresses.factory,
  ['event PairCreated(address indexed token0, address indexed token1, address pair, uint)'],
  account
);

const router = new ethers.Contract(
  addresses.router,
  [
    'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
    'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)'
  ],
  account
);

const wbnb = new ethers.Contract(
  addresses.WBNB,
  [
    'function approve(address spender, uint amount) public returns(bool)',
  ],
  account
);

const init = async () => {
  const tx = await wbnb.approve(
    router.address, 
    ethers.constants.MaxUint256
  );
  const receipt = await tx.wait(); 
  console.log('Transaction receipt');
  console.log(receipt);
}

factory.on('PairCreated', async (token0, token1, pairAddress) => {
  token0 = token0.toLowerCase();
  token1 = token1.toLowerCase();

  console.log('here');
  console.log(`
    New pair detected
    =================
    token0: ${token0}
    token1: ${token1}
    pairAddress: ${pairAddress}
  `);

  //The quote currency needs to be WBNB (we will pay with WBNB)
  let tokenIn, tokenOut;
  if(token0 === addresses.WBNB) {
    tokenIn = token0; 
    tokenOut = token1;
  }

  if(token1 === addresses.WBNB) {
    tokenIn = token1; 
    tokenOut = token0;
  }

  //The quote currency is not WBNB
  if(typeof tokenIn === 'undefined') {
    return;
  }

  if(tokenOut === tokens.TOB){
    console.log(`
    TOKEN BETITO
    =================    
  `);
  }else{
    return;
  }
  //tokenOut = tokens.TOB;
  //tokenOut = '0xd4cc9538bbd3eda848da2292c0e383835703f138'; //busd
  //tokenOut = '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82';
  // //We buy for 0.1 BNB of the new token
  // //ethers was originally created for Ethereum, both also work for BSC
  // //'ether' === 'bnb' on BSC
  const amountIn = ethers.utils.parseUnits('0.001', 'ether');
  const amounts = await router.getAmountsOut(amountIn, [tokenIn, tokenOut]);
  // //Our execution price will be a bit different, we need some flexbility
  console.log(amounts);
  const amountOutMin = amounts[1].sub(amounts[1].div(10));
  console.log(`
    Buying new token
    =================
    tokenIn: ${amountIn.toString()} ${tokenIn} (WBNB)
    tokenOut: ${amountOutMin.toString()} ${tokenOut}
  `);


  const gasPrice = ethers.utils.parseUnits('10', 'gwei');
  //let gasPrice = await provider.getGasPrice();
  const gasLimit = 261272;

  let temp = await router.signer.getAddress();
  console.log(`
    Gas
    =================
    gasPrice: ${gasPrice}
    tokenOut: ${temp}
  `);



  
  const tx = await router.swapExactTokensForTokens(
    amountIn,        
    amountOutMin,
    [tokenIn, tokenOut],
    addresses.recipient,
    Date.now() + 1000 * 60 * 10, //10 minutes
    { gasPrice: gasPrice, gasLimit: gasLimit}
  );
  const receipt = await tx.wait(); 
  console.log('Transaction receipt');
  console.log(receipt);
  process.exit(1);  
});


async function getPrice(inputCurrency, outputCurrency){
  const amounts = await router.getAmountsOut(ethers.utils.parseUnits('1', 18), [inputCurrency, outputCurrency]);
  return amounts[1].toString()/1e18;
}

init();