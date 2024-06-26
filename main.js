const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const os = require('os')

class ModuleInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
	}

	async init(config) {
		this.configUpdated(config)
	}

	// When module gets deleted
	async destroy() {
		this.log('debug', 'destroyed.')
	}

	async configUpdated(config) {
		this.config = config
		let host = this.config.bonjour_host || `${this.config.host}:9999`
		let companionIP = undefined
		let NIList = os.networkInterfaces()
	
		for (var NI in NIList) {
			for (var NIEntry of NIList[NI]) {
				if (NIEntry.family == 'IPv4' && !NIEntry.internal) {
					companionIP = NIEntry.address
					try {
						console.log(`Sending Companion IP of ${companionIP} to satellite at ${host}`)
						await fetch(`http://${host}/api/host`, {
							method: 'POST',
							body: companionIP,
							headers: {
								'Content-Type': 'text/plain',
							},
						})
						this.updateStatus(InstanceStatus.Ok)
						break
					} catch (e) {
						console.log(e.cause)
						this.updateStatus(InstanceStatus.Disconnected)
					}					
				}
			}
		}
	}

	// Return config fields for web config
	getConfigFields() {
		return [
			{
				type: 'bonjour-device',
				id: 'bonjour_host',
				label: 'Bonjour Address of Satellite',
				width: 6,
				default: '',
				regex: Regex.IP,
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'IP Address of Satellite',
				width: 6,
				default: '192.168.1.21',
				regex: Regex.IP,
				isVisible: (options) => !options.bonjour_host,
			},
			{
				type: 'static-text',
				label: '',
				width: 6,
				isVisible: (options) => !!options.bonjour_host,
			},
		]
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
