# HassBeam Connect Cards

Custom Lovelace cards for setting up and managing HassBeam in Home Assistant.
This Project needs [HassBeam Connect Backend](https://github.com/BasilBerg/hassbeam-connect-backend) to fully work.

## Features

### Setup Card

- Simplifies the setup process of a HassBeam universal remote
- Capture IR codes from remote controls
- Save IR codes with custom device and action names 
<img width="2291" height="446" alt="grafik" src="https://github.com/user-attachments/assets/463d33d0-42cf-4143-a081-7ce4b9963ea7" />


### Manager Card

- Display IR codes in a configurable table
- Filter by device and action
- Send IR codes directly from the interface
- Delete stored IR codes
- Real-time data updates

<img width="2278" height="853" alt="grafik" src="https://github.com/user-attachments/assets/2976ff1d-1882-4b36-9d74-94520a59415d" />


## Installation

HassBeam Connect comes in two separate repos that contain the backend and frontend of the integration. You can install both manually but it is recommended to install them via [HACS](https://www.hacs.xyz/docs/use/download/download/)

- open HACS and click on the settings in the top right corner
- select custom repository
- add these two repositories:
  - Backend: `https://github.com/BasilBerg/hassbeam-connect-backend` Type: Integration 
  - Lovelace Cards: `https://github.com/BasilBerg/hassbeam-connect-cards` Type: Dashboard
- Search `HassBeam` in HACS and install `HassBeam Connect Backend` and `HassBeam Connect Cards`
- Go to Devices & Services and add the `HassBeam Connect Backend``Integration
- You can now add the `hassbeam-setup-card` and `hassbeam-manager-card` on any lovelace dashboard



### Compatibility
#### HassBeam
HassBeam Connect will work out of the box with your HassBeam devices, there is no additional configuration required. You can find more information [here](https://github.com/BasilBerg/hassbeam/blob/main/setup.md) 

#### Other ESPHome devices
To use HassBEam Connect with other ESPHome devices, you have to modify the configuration of your device to include this:
```yaml
# Transmitter Configuration
remote_transmitter:
  pin: GPIO27 #replace with your transmitter pin
  carrier_duty_percent: 50%

# Api Configuration
api:
  services:
    #service for sending pronto codes
    - service: send_ir_pronto
      variables:
        data: string
      then:
        - remote_transmitter.transmit_pronto:
            data: !lambda "return data.c_str();"
        - script.execute:
            id: update_protocol_sent
            protocol: "Pronto"

# Receiver Configuration
remote_receiver:
  pin:
    number: GPIO14 #replace with your receiver pin
    inverted: true
    mode:
      input: true
      pullup: true
  dump: all
  idle: 25ms
  buffer_size: 2kb

  # Event Configuration
  on_pronto:
    #fire event when pronto code is received
    - homeassistant.event:
        event: esphome.hassbeam.ir_received
        data:
          hassbeam_device: ${device_name_sub}
          protocol: "Pronto"
          data: !lambda "return x.data.c_str();"

```

## Using HassBeam Connect


### Capturing commands
To capture IR commands you can use the `hassbeam-setup-card`.
- click Start Listening
- press the Button of the original remote
- the captured command(s) should now appear in the list
  - you can filter the list by protocol or leave this field empty to display all protocols
  - pronto is selected by default since it is not protocol specific and should work for all common devices
- Pick the command you want to save
  - if you're not sure which one will work, you can click send to replay the command and check if the device reacts as expected
  - click select on the command you want to save
- enter the name of the device this command controls
- enter the name of the action this command performs
- click Save IR Code


### Managing stored commands
To manage stored IR commands you can use the `hassbeam-manager-card`. This card can display a list of all commands you have saved. you can filter them by target device or action and you can replay the command from within this list. You can also delete commands.


### Sending IR Commands
You can use the saved IR codes on your dashboard or inside scripts, automations etc. using the `hassbeam_connect_backend.send_ir_code` service.  
This can either be done in the UI or in YAML:

```yaml
action: hassbeam_connect_backend.send_ir_code
data:
  device: tv    #Device name you specified during setup
  action: power #Action name you specified during setup
```

## Links

- [HassBeam](https://github.com/BasilBerg/hassbeam)
- [HassBeam Connect Backend](https://github.com/BasilBerg/hassbeam-connect-backend)
- [Issues](https://github.com/BasilBerg/hassbeam-connect-cards/issues)
