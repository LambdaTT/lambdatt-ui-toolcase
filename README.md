# Dependencies:

```bash
npm install signature_pad
```
```bash
npm install chart.js@^2.9.4
```

# Access Eash Part Individually:

```javascript
import {TOOLCASE} from 'relative/path/to/lambdatt-ui-toolcase'

// Components:
TOOLCASE.COMPONENTS
// Pages:
TOOLCASE.PAGES
```

# Auto-Wire:

To auto-wire the Toolcase module, add the following to your `/src/boot/toolcase-boot.js`:

```javascript
import {TOOLCASE} from 'relative/path/to/lambdatt-ui-toolcase'

export default boot(({ app }) => {
    TOOLCASE.autoWire(app);
})
```