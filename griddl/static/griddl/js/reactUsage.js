
var Boxtree = React.createClass({
	render : function() {
		if (!this.props.children || this.props.children.length == 0) {
			return React.DOM.div({ className : 'boxtree' }, this.props.value);
		} else {
			return React.DOM.div({ className : this.props.value + ' boxtree' }, this.props.children.map(function (x) { return Boxtree(x); }));
		}
	}
});
var ReactIndentree = React.createClass({
	render : function() {
		return React.DOM.div({ className : 'indentree' }, [ this.props.value ].concat(this.props.children ? this.props.children.map(function (x) { return Indentree(x); }) : []));
	}
});
var TextResultsTable = React.createClass({
	render : function() {
		var trs = this.props.map(function (x) { return React.DOM.tr({}, [ React.DOM.td({}, x) ]); });
		var table = React.DOM.table({}, trs);
		return table;
	}
});
var InstanceResultsTable = React.createClass({
	render : function() {
		var th = InstanceResultsTableHeader(this.props);
		var trs = this.props.map(function (x) { return InstanceResultsTableRow(x); });
		var all = [th].concat(trs);
		var table = React.DOM.table({}, all);
		return table;
	}
});
var InstanceResultsTableHeader = React.createClass({
	render : function() {
		var ths = [];
		ths.push(React.DOM.td({}, 'id'));
		ths.push(React.DOM.td({}, 'created'));
		ths.push(React.DOM.td({}, 'externalA'));
		ths.push(React.DOM.td({}, 'externalB'));
		ths.push(React.DOM.td({}, 'gramId'));
		ths.push(React.DOM.td({}, 'gramType'));
		ths.push(React.DOM.td({}, 'seqPart'));
		ths.push(React.DOM.td({}, 'subs'));
		var tr = React.DOM.tr({}, ths);
		return tr;
	}
});
var InstanceResultsTableRow = React.createClass({
	render : function() {
		var tds = [];
		tds.push(React.DOM.td({}, this.props.id.toString()));
		tds.push(React.DOM.td({}, this.props.created.toString()));
		tds.push(React.DOM.td({}, this.props.externalA.toString()));
		tds.push(React.DOM.td({}, this.props.externalB.toString()));
		tds.push(React.DOM.td({}, this.props.gramId));
		tds.push(React.DOM.td({}, this.props.gramType));
		tds.push(React.DOM.td({}, this.props.seqPart));
		tds.push(React.DOM.td({}, this.props.subs));
		var tr = React.DOM.tr({}, tds);
		return tr;
	}
});

