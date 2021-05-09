# global-state-react

> Work like Redux but use like LocalStorage. When a global state is changed, only the related components are requested to update.

[![NPM](https://img.shields.io/npm/v/global-state-react.svg)](https://www.npmjs.com/package/global-state-react) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save global-state-react
```

## Usage

```tsx
import React, { Component } from 'react'

import MyComponent from 'global-state-react'
import 'global-state-react/dist/index.css'

class Example extends Component {
  render() {
    return <MyComponent />
  }
}
```

## License

MIT © [minhthongit2015](https://github.com/minhthongit2015)
