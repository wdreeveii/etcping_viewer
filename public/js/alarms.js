
var GraphPopOver = React.createClass({
	getInitialState: function() {
		return {ShowPopOver: false};
	},
	togglePopOver: function(ev) {
		if (this.state.ShowPopOver == false) {
			// turning popover on
			ev.target.addEventListener('mouseout', this.closePopOver);
		} else {
			ev.target.removeEventListener('mouseout', this.closePopOver);
		}
		this.setState({ShowPopOver: !this.state.ShowPopOver});
	},
	closePopOver: function() {
		this.setState({ShowPopOver: false});
	},
	render: function() {
		var divStyle = {
			top: $(window).scrollTop() + 300
		};
		var popover = null;
		if (this.state.ShowPopOver) {
			var plot_url = "/ping/plot/" + this.props.alarm.IP;
			popover = (
					<div style={divStyle} className="GraphPopOver"><img src={plot_url}/></div>
				);
		}
		return (
				<span>
				<button onClick={this.togglePopOver} className="glyphicon glyphicon-signal"></button>
				{popover}
				</span>
			);
	}
});

var AlarmList = React.createClass({
	render: function() {
		var alarmNodes = this.props.data.map(function(alarm) {
			var relative = "No communication history";
			
			if (alarm.DTStart.String != "0000-00-00 00:00:00") {
				relative = moment(alarm.DTStart.String, "YYYY-MM-DD hh:mm:ss").fromNow();
			}

			return (
				<tr>
					<td>{alarm.IP}</td>
					<td><GraphPopOver alarm={alarm}/></td>
					<td>{alarm.Alias.String}</td>
					<td>{alarm.DTStart.String}</td>
					<td>{relative}</td>
					<td>{alarm.Ticket.String}</td>
				</tr>
			);
		});
		return (
			<table className="table">
				<tbody>
					<tr>
						<th>IP</th>
						<td></td>
						<th>Alias</th>
						<th>Alarm Start</th>
						<th>Duration</th>
						<th>Ticket</th>
					</tr>
					{alarmNodes}
				</tbody>
			</table>
		);
	}
});

var AlarmBox = React.createClass({
	getInitialState: function() {
		return {
			data:[],
			last_update: null,
			last_update_ok: false,
		};
	},
	loadAlarmsFromServer: function() {
		$.ajax({
			url: this.props.url,
			dataType: 'json',
			success: function(data) {
				this.setState({
					data: data,
					last_update: new Date(),
					last_update_ok: true
				});
			}.bind(this),
			error: function(xhr, status, err) {
				console.error(this.props.url, status, err.toString());
				this.setState({last_update_ok: false});
			}.bind(this)
		});
	},
	componentDidMount: function() {
		this.loadAlarmsFromServer();
		setInterval(this.loadAlarmsFromServer, this.props.pollInterval);
	},
	render: function() {
		var last_update = moment(this.state.last_update).fromNow();
		var last_update_status = "";
		if (!this.state.last_update_ok) {
			last_update_status = " - last attempt failed";
		}
		return (
			<div className="container">
				<h1>Current Alarms <span className="updateStatus">Last updated {last_update}{last_update_status}.</span></h1>
				<AlarmList data={this.state.data} />
			</div>
			);
	}
});

React.render( <AlarmBox url="/ping/alarms" pollInterval={5000} />,
	document.getElementById('content')
);