# HassBeam Connect Cards

Custom Lovelace cards for setting up and managing HassBeam in Home Assistant.
This Project needs [HassBeam Connect Backend](https://github.com/BasilBerg/hassbeam_connect_backend) to fully work.

## Features

### Setup Card

- Simplifies the setup process of a HassBeam universal remote
- Capture IR codes from remote controls
- Save IR codes with custom device and action names 


### Manager Card

- Display IR codes in a configurable table
- Filter by device and action
- Send IR codes directly from the interface
- Delete stored IR codes
- Real-time data updates



## Installation

### HACS Installation (recommended)

It is recommended to install this dashboard with [HACS](https://www.hacs.xyz/docs/use/):

#### Add this repository to HACS

- Open HACS in Home Assistant
- Open the menu in the top-right corner
- Click 'Custom Repositories'
- Enter the URL of this repository `https://github.com/BasilBerg/hassbeam_connect_cards`
- Select type: `Dashboard` and add the repository

### Manual Installation

1. Download `hassbeam-card.js`, `hassbeam-manager-card.js`, and `hassbeam-setup-card.js`
2. Place them in your `www` folder
3. Add the resource to your Lovelace configuration:

   ```yaml
   resources:
     - url: /local/hassbeam-card.js
       type: module
   ```

## Configuration
Add the cards to a Lovelace Dashboard **using the UI** or the following YAML codes:

#### Setup Card Configuration

```yaml
type: custom:hassbeam-setup-card
```

#### Manager Card Configuration

```yaml
type: custom:hassbeam-manager-card
```


## Use saved IR codes
You can use the saved IR codes on your dashboard or inside scripts, automations etc. using the `hassbeam_connect_backend.send_ir_code` service. You can do this in the UI or like this:
```yaml
action: hassbeam_connect_backend.send_ir_code
data:
  device: tv    #Device name you specified during setup
  action: power #Action name you specified during setup
```

## Requirements

- Home Assistant with Lovelace UI
- HassBeam Connect Backend integration
- HassBeam device

## Links

- [HassBeam](https://github.com/BasilBerg/hassbeam)
- [HassBeam Connect Backend](https://github.com/BasilBerg/hassbeam_connect_backend)
- [Issues](https://github.com/BasilBerg/hassbeam_connect_cards/issues)
