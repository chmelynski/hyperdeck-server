
function Calculate()
{
	globals.calculationRound = 0;
	
	while (globals.queue.length > 0)
	{
		if (globals.calculationRound == 100)
		{
			throw new Error();
		}
		
		//globals.log = [];
		
		globals.blankingMode = false;
		
		// see if we're in blanking mode
		for (var i = 0; i < globals.queue.length; i++)
		{
			var message = globals.queue[i];
			if (message.type == Message.Blank) { globals.blankingMode = true; };
		}
		
		for (var i = 0; i < globals.queue.length; i++)
		{
			// what if a cog receives more than one message in a round?
			// we probably don't want it to act twice
			// so we might want to add a flag or something indicating that the cog has already acted
			
			var message = globals.queue[i];
			
			if (globals.blankingMode && message.type != Message.Blank && message.type != Message.PartBlanked)
			{
				globals.newqueue.push(message);
				continue;
			}
			
			var s = "";
			s += globals.calculationRound.toString();
			s += "\t";
			s += MessageDict[message.type];
			s += "\t";
			s += message.src === null ? "null" : LinkStringFromGlobals(message.src);
			s += "\t";
			s += message.dst === null ? "null" : LinkStringFromGlobals(message.dst);
			s += "\t";
			s += message.edge === null ? "null" : EdgeDict[message.edge.type];
			s += "\t";
			s += message.setValue === null ? "null" : ((typeof(message.setValue) == "object" || typeof(message.setValue) == "string" || typeof(message.setValue) == "function") ? "object/string/function" : message.setValue);
			globals.log.push(s);
			
			var cog = message.dst;
			cog.act(cog, message);
		}
		
		for (var i = 0; i < globals.queue.length; i++)
		{
			var message = globals.queue[i];
			var cog = message.dst;
			cog.state = cog.newState;
			//cog.newState = null; // if a cog receives two messages in the same round, then we don't want this null overriding state on the second message
		}
		
		globals.queue = globals.newqueue;
		globals.newqueue = [];
		
		globals.calculationRound++;
	}
	
	globals.calculationRound = -1;
}

function Broadcast(cog, messageType, params)
{
	var node = cog.node;
	
	// params:
	//   type
	//   level (not implemented yet)
	//   exclude
	//   direction (used for structs, so that PartSet/etc. messages only go *up* (out), not down to its own parts
	//   setValue (from an exp to its pout, and thence to pout.$
	
	if (!params.direction || params.direction == "in")
	{
		for (var k = 0; k < node.ins.length; k++)
		{
			var edge = node.ins[k];
			
			if (edge.type == params.type)
			{
				if (!params.exclude || params.exclude != edge)
				{
					var message = { type : messageType , src : cog , dst : edge.src.contents , edge : edge };
					if (params.setValue) { message.setValue = params.setValue };
					//globals.log.push(MessageDict[message.type] + "\t" + LinkStringFromGlobals(message.src) + "\t" + LinkStringFromGlobals(message.dst) + "\t" + EdgeDict[message.edge.type] + "\tnull");
					globals.newqueue.push(message);
				}
			}
		}
	}
	
	if (!params.direction || params.direction == "out")
	{
		for (var k = 0; k < node.ous.length; k++)
		{
			var edge = node.ous[k];
			
			if (edge.type == params.type)
			{
				if (!params.exclude || params.exclude != edge)
				{
					var message = { type : messageType , src : cog , dst : edge.dst.contents , edge : edge };
					if (params.setValue) { message.setValue = params.setValue };
					//globals.log.push(MessageDict[message.type] + "\t" + LinkStringFromGlobals(message.src) + "\t" + LinkStringFromGlobals(message.dst) + "\t" + EdgeDict[message.edge.type] + "\tnull");
					globals.newqueue.push(message);
				}
			}
		}
	}
}

function MakeSlot(parent, name, value)
{
	var cog = MakeObj(parent, name);
	cog.type = Machine.Slot;
	
	// this used to be cog.state = State.Inactive - does this break anything?
	if (value != null)
	{
		cog.state = State.Nonblank;
		
		if (typeof(value) != "object")
		{
			cog.formula = value.toString();
		}
		else
		{
			cog.formula = "";
		}
	}
	else
	{
		cog.state = State.Blank;
		cog.formula = "";
	}
	
	cog.act = ProcessSlot;
	cog.$ = value;
	cog.node = MakeNode(cog, "node", cog);
	
	return cog;
}

function MakePointer(parent, name, slot)
{
	var cog = MakeObj(parent, name);
	cog.type = Machine.Pointer;
	cog.state = State.Inactive;
	cog.act = ProcessPointer;
	cog.$ = null;
	
	cog.name = null;
	cog.scope = null;
	
	cog.node = MakeNode(cog, "node", cog);
	
	if (slot)
	{
		cog.$ = slot;
		AddEdge(cog.node, slot.node, "$", Edge.$);
	}
	
	return cog;
}

function MakeExp(parent, name)
{
	var cog = MakeObj(parent, name);
	cog.type = Machine.Exp;
	cog.state = State.Inactive;
	cog.act = ProcessExp;
	
	cog.pout = null;
	cog.f = null;
	cog.args = MakeList(cog, "args");
	
	cog.node = MakeNode(cog, "node", cog);
	
	return cog;
}

function MakeControl(parent, name)
{
	var cog = MakeObj(parent, name);
	cog.type = Machine.Control;
	cog.state = State.Inactive;
	cog.act = ProcessControl;
	
	cog.node = MakeNode(cog, "node", cog);
	
	return cog;
}

function MakeConstraint(parent, name, op)
{
	var cog = MakeObj(parent, name);
	cog.type = Machine.Constraint;
	cog.state = State.Inactive;
	cog.act = ProcessConstraint;
	
	cog.op = op;
	cog.arglist = MakeList(cog, "arglist");
	
	cog.node = MakeNode(cog, "node", cog);
	
	return cog;
}

function ProcessSlot(x, message)
{
	// slots should possibly broadcast along Edge.Scope links for both blanking and setting
	
	switch (message.type)
	{
		case Message.Activate:
			if (x.$ == null)
			{
				SetNewState(x, State.Blank);
			}
			else
			{
				//Broadcast(x, Message.Set, { type : Edge.$ }); // this is probably unnecessary, as nonblank slots are never part of code (code is just pointers and exps)
				SetNewState(x, State.Nonblank);
			}
			break;
		case Message.Deactivate:
			SetNewState(x, State.Inactive);
			break;
		case Message.Blank:
			SetNewState(x, State.Blank);
			Broadcast(x, Message.PartBlanked, { type : Edge.Part , level : 1 });
			Broadcast(x, Message.Blank, { type : Edge.$ , exclude : message.edge });
			break;
		case Message.Set:
			//if (x["[id]"] == 387)
			//{
			//	debugger;
			//}
			x.$ = message.setValue;
			// for situations like 'data := (map EmptyObj (enum 5))' - the result of the map has no parent
			if (typeof(message.setValue) == "object" && message.setValue != null && message.setValue["[parent]"] === undefined)
			{
				AddBracketFields(message.setValue, x, "$");
			}
			if (x.react) { x.react(); } // get rid of this
			if (x.state == State.Nonblank)
			{
				Broadcast(x, Message.Blank, { type : Edge.$ , exclude : message.edge });
				Broadcast(x, Message.PartBlanked, { type : Edge.Part , level : 1 });
			}
			Broadcast(x, Message.Set, { type : Edge.$ }); // i used to have 'exclude : message.edge' here, but removed it - we want a backboard here
			Broadcast(x, Message.Set, { type : Edge.Display });
			Broadcast(x, Message.PartSet, { type : Edge.Part , level : 1 });
			SetNewState(x, State.Nonblank);
			break;
		case Message.PartBlanked:
			if (x.state == State.Nonblank)
			{
				SetNewState(x, State.Blank);
				Broadcast(x, Message.Blank, { type : Edge.$ });
				Broadcast(x, Message.PartBlanked, { type : Edge.Part , direction : "out" , level : message.level + 1 });
			}
			break;
		case Message.PartSet:
			if (AllFieldsNonblank(x)) // we could use reference counting here instead of polling each time
			{
				SetNewState(x, State.Nonblank);
				Broadcast(x, Message.Set, { type : Edge.$ });
				Broadcast(x, Message.PartSet, { type : Edge.Part , direction : "out" , level : message.level + 1 });
			}
			break;
		case Message.PartAdded: // so InsertObj/InsertFld has to tell the obj to broadcast a Message.PartAdded to get this ball rolling
			Broadcast(x, Message.Blank, { type : Edge.$ });
			Broadcast(x, Message.Set, { type : Edge.$ });
			Broadcast(x, Message.PartAdded, { type : Edge.Part , direction : "out" , level : message.level + 1 }); // send name of added part?
			Broadcast(x, Message.PartAdded, { type : Edge.Display , level : message.level }); // send name of added part?
			Broadcast(x, Message.PartAdded, { type : Edge.FieldSlot , level : message.level });
			break;
		case Message.PartRemoved: // so DeleteObj/DeleteFld has to tell the obj to broadcast a Message.PartRemoved to get this ball rolling
			Broadcast(x, Message.Blank, { type : Edge.$ });
			Broadcast(x, Message.Set, { type : Edge.$ });
			Broadcast(x, Message.PartRemoved, { type : Edge.Part , direction : "out" , level : message.level + 1 }); // send name of removed part?
			Broadcast(x, Message.PartRemoved, { type : Edge.Display , level : message.level }); // send name of removed part?
			break;
		default:
			throw new Error();
	}
}

function AllFieldsNonblank(x)
{
	var struct = Get(x);
	var keys = PublicKeys(struct);
	
	for (var i = 0; i < keys.length; i++)
	{
		var key = keys[i];
		var slot = struct[key];
		
		if (slot.state != State.Nonblank)
		{
			return false;
		}
	}
	
	return true;
}

function ProcessPointer(x, message)
{
	switch (message.type)
	{
		case Message.Activate:
			SetNewState(x, State.Unbound);
			Bind(x);
			break;
		case Message.Deactivate:
			SetNewState(x, State.Inactive);
			break;
		case Message.Blank:
			switch (message.edge.type)
			{
				case Edge.Scope:
				case Edge.Name: // right now, ptr.name is not a slot - but it could be in the future
					SetNewState(x, State.Unbound);
					break;
				case Edge.$:
					SetNewState(x, State.Blank);
					Broadcast(x, Message.Blank, { type : Edge.Arg });
					Broadcast(x, Message.Blank, { type : Edge.Scope , direction : "in" });
					break;
				case Edge.Arg: // Constraints send Blank messages over Arg channels
				case Edge.Pout:
					SetNewState(x, State.Blank);
					Broadcast(x, Message.Blank, { type : Edge.Arg , exclude : message.src.edge });
					Broadcast(x, Message.Blank, { type : Edge.Scope , direction : "in" });
					break;
				default:
					throw new Error();
			}
			break;
		case Message.Set:
			switch (message.edge.type)
			{
				case Edge.Scope:
				case Edge.Name:
					Bind(x);
					break;
				case Edge.$:
					SetNewState(x, State.Nonblank);
					Broadcast(x, Message.Set, { type : Edge.Arg });
					Broadcast(x, Message.Set, { type : Edge.Scope , direction : "in" });
					break;
				case Edge.Arg: // Constraints send Set messages over Arg channels
				case Edge.Pout:
					SetNewState(x, State.Nonblank);
					Broadcast(x, Message.Set, { type : Edge.Arg , exclude : message.src.edge });
					Broadcast(x, Message.Set, { type : Edge.Scope , direction : "in" });
					break;
				default:
					throw new Error();
			}
			break;
		case Message.SetResult: // this always comes over an Edge.Pout
			//SetNewState(x, State.Nonblank);
			Broadcast(x, Message.Set, { type : Edge.$ , setValue : message.setValue }); // there might be a timing issue here - slot.$ will not actually be assigned until next round
			//Broadcast(x, Message.Set, { type : Edge.Arg });
			//Broadcast(x, Message.Set, { type : Edge.Scope , direction : "in" });
			break;
		default:
			throw new Error();
	}
}

function ProcessExp(x, message)
{
	//if (x["[id]"] == 397)
	//{
	//	debugger;
	//}
	
	switch (message.type)
	{
		case Message.Activate:
			SetNewState(x, State.FirstFire);
			break;
		case Message.Deactivate:
			SetNewState(x, State.Inactive);
			break;
		case Message.Blank:
			SetNewState(x, State.Waiting);
			Broadcast(x, Message.Blank, { type : Edge.Pout });
			break;
		case Message.Set:
			if (CheckFire(x))
			{
				var result = Fire(x); // perhaps we should just put the fire code here?
				SetNewState(x, State.Fired);
				Broadcast(x, Message.SetResult, { type : Edge.Pout , setValue : result });
			}
			break;
		default:
			throw new Error();
	}
}

function Bind(x)
{
	if (x.$ == null)
	{
		var scope = Get(x.scope);
		var name = Get(x.name);
		
		while (scope && name)
		{
			if (scope[name])
			{
				var slot = scope[name];
				x.$ = slot;
				AddEdge(x.node, slot.node, "$", Edge.$);
				break;
			}
			else
			{
				scope = scope["[parent]"];
			}
		}
	}
	
	if (x.$)
	{
		// the newState check is a semi-dangerous resolution to a timing issue
		// basically when you load a grid, the slots get Set and the pointers Bind in the same calculation round
		// so that when the pointers Bind, the slots have state == Blank and newState == Nonblank
		// we want the pointers to recognize that the slots are nonblank
		if (x.$.state == State.Nonblank || x.$.newState == State.Nonblank)
		{
			Broadcast(x, Message.Set, { type : Edge.Arg });
			Broadcast(x, Message.Set, { type : Edge.Scope , direction : "in" });
			SetNewState(x, State.Nonblank);
		}
	}
}

function CheckFire(x)
{
	//if (x["[id]"] == 437)
	//{
	//	debugger;
	//}
	
	// if f and all args are nonblank, and the pout is blank, then fire
	// exps in the FirstFire state can fire if the pout is unbound or even nonblank (this happens in a newly-placed assignment, for instance)
	var fire = true;
	for (var i = 0; i < x.args.length; i++) { if (x.args[i].state != State.Nonblank) { fire = false; break; } }
	if (x.f.state != State.Nonblank) { fire = false; }
	if (x.state == State.Waiting && x.pout.state != State.Blank) { fire = false; }
	return fire;
}

function ProcessControl(x, message)
{

}

function ProcessConstraint(x, message)
{
	// on activation, change state to Setting
	
	//if (x.state == State.Nonblank)
	//{
	//	if (x.op == "=")
	//	{
	//		for (var i = 0; i < x.arglist.length; i++)
	//		{
	//			if (x.arglist[i].state == State.Blanking)
	//			{
	//				// flip 0 and i, so that 0 is the one that will be setting
	//				var temp = x.arglist[0];
	//				x.arglist[0] = x.arglist[i];
	//				x.arglist[i] = temp;
	//				
	//				var ou0 = null;
	//				var oui = null;
	//				
	//				for (var k = 0; k < x.node.ous.length; k++)
	//				{
	//					if (x.node.ous[k].label == "0")
	//					{
	//						ou0 = x.node.ous[k];
	//					}
	//					
	//					if (x.node.ous[k].label == i.toString())
	//					{
	//						oui = x.node.ous[k];
	//					}
	//				}
	//				
	//				ou0.label = i.toString();
	//				oui.label = "0";
	//				
	//				SetNewState(x, State.Blanking);
	//				break; // hopefully only one arg will be blanked at a time
	//			}
	//		}
	//	}
	//	else
	//	{
	//		if (x.arglist[0].state == State.Blanking)
	//		{
	//			// flip arglist 0 and 1, flip the op to inverse
	//			var temp = x.arglist[0];
	//			x.arglist[0] = x.arglist[1];
	//			x.arglist[1] = temp;
	//			
	//			var ou0 = null;
	//			var ou1 = null;
	//			
	//			for (var k = 0; k < x.node.ous.length; k++)
	//			{
	//				if (x.node.ous[k].label == "0")
	//				{
	//					ou0 = x.node.ous[k];
	//				}
	//				
	//				if (x.node.ous[k].label == "1")
	//				{
	//					ou1 = x.node.ous[k];
	//				}
	//			}
	//			
	//			ou0.label = "1";
	//			ou1.label = "0";
	//			
	//			x.op = globals.inverses[x.op];
	//				
	//			SetNewState(x, State.Blanking);
	//		}
	//		
	//		for (var i = 1; i < x.arglist.length; i++)
	//		{
	//			if (x.arglist[i].state == State.Blanking)
	//			{
	//				SetNewState(x, State.Blanking);
	//			}
	//		}
	//	}
	//}
	//else if (x.state == State.Blanking)
	//{
	//	// to do: push the blanking to the proper subs
	//	
	//	SetNewState(x, State.Blank);
	//}
	//else if (x.state == State.Blank)
	//{
	//	if (x.op == "=")
	//	{
	//		if (x.arglist[0].state == State.Nonblank)
	//		{
	//			FireEq(x);
	//			SetNewState(x, State.Setting);
	//		}
	//	}
	//	else
	//	{
	//		for (var i = 1; i < x.arglist.length; i++)
	//		{
	//			if (x.arglist[i].state == State.Nonblank)
	//			{
	//				FireEq(x);
	//				SetNewState(x, State.Setting);
	//			}
	//		}
	//	}
	//}
	//else if (x.state == State.Setting)
	//{
	//	SetNewState(x, State.Nonblank);
	//}
}

function ProcessGrid(x, message)
{
	x.redisplay(x);
	x.position(x);
}

function ProcessCell(x, message)
{
	x.redisplay(x);
	//x.position(x);
}

function SetNewState(cog, newstate)
{
	//globals.log.push(globals.calculationRound.toString() + "\t" + MachineDict[cog.type] + "\t" + cog["[id]"].toString() + "\t" + StateDict[cog.state] + "\t" + StateDict[newstate] + "\t" + LinkStringFromGlobals(cog));
	cog.newState = newstate;
}

function FireEq(x)
{
	var total = null;
	
	var args = [];
	
	for (var i = 0; i < x.arglist.length; i++)
	{
		args.push(GetSlot(x.arglist[i]));
	}
	
	if (x.op == "=")
	{
		// = is a little different than the rest - here we take changes in one slot and propagate them to all the others
		
		total = Get(args[0]);
		
		for (var i = 1; i < args.length; i++)
		{
			Set(args[i], total);
		}
	}
	else if (x.op == "=+")
	{
		total = 0.0;
		
		for (var i = 1; i < args.length; i++)
		{
			total += Get(args[i]);
		}
		
		Set(args[0], total);
	}
	else if (x.op == "=-")
	{
		total = Get(args[1]);
		
		for (var i = 2; i < args.length; i++)
		{
			total -= Get(args[i]);
		}
		
		Set(args[0], total);
	}
	else if (x.op == "=*")
	{
		total = 1.0;
		
		for (var i = 1; i < args.length; i++)
		{
			total *= Get(args[i]);
		}
		
		Set(args[0], total);
	}
	else if (x.op == "=/")
	{
		total = Get(args[1]);
		
		for (var i = 2; i < args.length; i++)
		{
			total /= Get(args[i]);
		}
		
		Set(args[0], total);
	}
}

function Fire(exp)
{
	var f = Get(exp.f);
	
	var args = [];
	
	for (var i = 0; i < exp.args.length; i++)
	{
		args.push(Get(exp.args[i])); // if we want to add a & operator and pass in slots as lvals, we'll need to do the Get (or not) in Apply, not here
	}
	
	var result = Apply(f, args);
	
	// this is invoked for intermediate pointers, and possibly other things
	if (!exp.pout.$)
	{
		var newSlot = MakeSlot(exp.pout, "$", null); // so in this case the slot hangs from the pointer - you could make a case that it should hang from Pointer["[parent]"] (which should be a code[])
		exp.pout.$ = newSlot;
		AddEdge(exp.pout.node, newSlot.node, "$", Edge.$);
		newSlot.state = State.Nonblank; // newSlot isn't a recipient of a message, so the loop in Caculate that sets .state from .newState won't hit it
		newSlot.newState = State.Nonblank; // that being said, it can't hurt to set newState as well, just in case it *is* the recipient of a message somehow
	}
	
	return result;
}

function Apply(f, args) // potential callers could be 'Fire', 'map', and 'Execute'
{
	//// change the args param of the Apply function to argPtrs
	//var args = [];
	//for (var i = 0; i < argPtrs.length; i++)
	//{
	//	var argPtr = argsPtrs[i];
	//	
	//	if (argPtr["[&]"])
	//	{
	//		args.push(argPtr.$); // push the slot as an lval
	//	}
	//	else
	//	{
	//		args.push(Get(argPtr)); // push the slot value (an rval)
	//	}
	//}
	
	var result = null;
	
	if (typeof(f) == "function")
	{
		result = f(args);
	}
	else if (f["[type]"] == "Functor")
	{
		result = f.f(args);
	}
	else if (f["[type]"] == "frce")
	{
		// this is a rough sketch of how we might execute a frce function
		throw new Error();
		
		//var scope = MakeObj(null, "<" + f.name + ">"); // hang the scope from where, exactly?  should we pass a scope into Apply?
		//
		//for (var i = 0; i < args.length; i++)
		//{
		//	var paramName = f.params[i];
		//	var arg = args[i];
		//	scope[paramName] = arg;
		//}
		//
		//InterpretCode(scope, f);
	}
	else
	{
		throw new Error();
	}
	
	return result;
}

function DispatchLisp(code, root)
{
	var result = null;
	
	var value = Get(root.contents);
	
	if (value == "()")
	{
		var ptr = MakePointer(code, code.length.toString(), null);
		code.push(ptr);
		var exp = MakeExp(code, code.length.toString());
		code.push(exp);
		
		exp.pout = ptr;
		AddEdge(exp.node, ptr.node, "pout", Edge.Pout);
		
		for (var i = 0; i < root.children.length; i++)
		{
			var arg = DispatchLisp(code, root.children[i]);
			
			if (i == 0)
			{
				exp.f = arg;
				AddEdge(exp.node, arg.node, "f", Edge.Arg);
			}
			else
			{
				exp.args.push(arg);
				AddEdge(exp.node, arg.node, (i - 1).toString(), Edge.Arg);
			}
		}
		
		result = ptr;
	}
	else if (value == "." || value == "[]")
	{
		var ptr = MakePointer(code, code.length.toString(), null);
		code.push(ptr);
		
		var scope = DispatchLisp(code, root.children[0]);
		ptr.scope = scope;
		AddEdge(ptr.node, scope.node, "scope", Edge.Scope);
		ptr.name = StripQuotes(root.children[1].contents);
		
		result = ptr;
	}
	else if (value == "=" || value == "=+" || value == "=-" || value == "=*" || value == "=/")
	{
		result = MakeConstraint(code, code.length.toString(), value);
		code.push(result);
		
		for (var i = 0; i < root.children.length; i++)
		{
			var ptr = DispatchLisp(code, root.children[i]);
			result.arglist.push(ptr);
			AddEdge(result.node, ptr.node, i.toString(), Edge.Arg);
		}
	}
	else
	{
		if (IsDigit(value[0]) || (value.length > 1 && value[0] == '.'))
		{
			result = DispatchNumber(code, value);
		}
		else if (value[0] == '"' || value[0] == "'")
		{
			result = DispatchString(code, value);
		}
		else if (value == "true" || value == "false")
		{
			result = DispatchBoolean(code, value);
		}
		else
		{
			result = DispatchName(code, value);
		}
	}
	
	return result;
}

function StripQuotes(str)
{
	if (str[0] == '"' || str[0] == "'")
	{
		return str.substring(1, str.length - 1);
	}
	else
	{
		return str;
	}
}

function DispatchName(code, value)
{
	var ptr = MakePointer(code, code.length.toString(), null);
	code.push(ptr);
	ptr.name = value;
	return ptr;
}

function DispatchNumber(code, value)
{
	var slot = MakeSlot(code, code.length.toString(), null);
	code.push(slot);
	var ptr = MakePointer(code, code.length.toString(), slot);
	code.push(ptr);
	
	if (value.indexOf(".") != -1)
	{
		Set(slot, parseFloat(value));
		slot.valueType = "double";
	}
	else
	{
		Set(slot, parseInt(value));
		slot.valueType = "int";
	}
	
	Lock(slot); // cog or node?
	
	return ptr;
}

function DispatchBoolean(code, value)
{
	var slot = MakeSlot(code, code.length.toString(), null);
	code.push(slot);
	var ptr = MakePointer(code, code.length.toString(), slot);
	code.push(ptr);
	
	Set(slot, eval(value));
	slot.valueType = "boolean";
	
	Lock(slot); // cog or node?
	
	return ptr;
}

function DispatchString(code, value)
{
	var s = value.substring(1, value.length - 1); // we assume the string is enclosed in ""
	var slot = MakeSlot(code, code.length.toString(), s);
	code.push(slot);
	slot.valueType = "string";
	Lock(slot);
	var ptr = MakePointer(code, code.length.toString(), slot);
	code.push(ptr);
	return ptr;
}

function Lock(slot) { slot.locked = true; }

var Machine = {};
Machine.Slot = 0;
Machine.Pointer = 1;
Machine.Exp = 2;
Machine.Control = 3;
Machine.Constraint = 4;

var State = {};
State.Inactive = 0;
State.Blank = 1;
State.Nonblank = 2;
State.Unbound = 3;
State.FirstFire = 4;
State.Waiting = 5
State.Fired = 6;

var Message = {};
Message.Activate = 0;
Message.Deactivate = 1;
Message.Blank = 2;
Message.Set = 3;
Message.PartBlanked = 4;
Message.PartSet = 5;
Message.PartAdded = 6;
Message.PartRemoved = 7;
Message.SetResult = 8;

var Edge = {};
Edge.$ = 0;
Edge.Arg = 1;
Edge.Pout = 2;
Edge.Control = 3;
Edge.Scope = 4;
Edge.Name = 5;
Edge.Part = 6;
Edge.Display = 7;
Edge.Lock = 8;
Edge.FieldSlot = 9;

var StateDict = [];
StateDict[0] = "Inactive";
StateDict[1] = "Blank";
StateDict[2] = "Nonblank";
StateDict[3] = "Unbound";
StateDict[4] = "FirstFire";
StateDict[5] = "Waiting";
StateDict[6] = "Fired";

var MessageDict = [];
MessageDict[0] = "Activate";
MessageDict[1] = "Deactivate";
MessageDict[2] = "Blank";
MessageDict[3] = "Set";
MessageDict[4] = "PartBlanked";
MessageDict[5] = "PartSet";
MessageDict[6] = "PartAdded";
MessageDict[7] = "PartRemoved";
MessageDict[8] = "SetResult";

var EdgeDict = [];
EdgeDict[0] = "$";
EdgeDict[1] = "Arg";
EdgeDict[2] = "Pout";
EdgeDict[3] = "Control";
EdgeDict[4] = "Scope";
EdgeDict[5] = "Name";
EdgeDict[6] = "Part";
EdgeDict[7] = "Display";
EdgeDict[8] = "Lock";
EdgeDict[9] = "FieldSlot";

var MachineDict = [];
MachineDict[0] = "Slot";
MachineDict[1] = "Pointer";
MachineDict[2] = "Exp";
MachineDict[3] = "Control";
MachineDict[4] = "Constraint";

