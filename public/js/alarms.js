
var AlarmList = React.createClass({
	render: function() {
		var alarmNodes = this.props.data.map(function(alarm) {
			var relative = moment(alarm.DTStart.String, "YYYY-MM-DD hh:mm:ss").fromNow();

			return (
				<tr>
					<td>{alarm.IP}</td>
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
		return {data:[]};
	},
	loadAlarmsFromServer: function() {
		$.ajax({
			url: this.props.url,
			dataType: 'json',
			success: function(data) {
				this.setState({data: data});
			}.bind(this),
			error: function(xhr, status, err) {
				console.error(this.props.url, status, err.toString());
			}.bind(this)
		});
	},
	componentDidMount: function() {
		this.loadAlarmsFromServer();
		setInterval(this.loadAlarmsFromServer, this.props.pollInterval);
	},
	render: function() {
		return (
			<div className="container">
				<h1>Current Alarms</h1>
				<AlarmList data={this.state.data} />
			</div>
			);
	}
});

React.render( <AlarmBox url="/ping/alarms" pollInterval={5000} />,
	document.getElementById('content')
);