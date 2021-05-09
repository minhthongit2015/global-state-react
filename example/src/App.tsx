import React from 'react'

import { GlobalState } from 'global-state-react'
import 'global-state-react/dist/index.css'

const App = () => {
  GlobalState.init();
  GlobalState.useState('hello', { test: 1234 });
  return <>Hello</>
}

export default App
