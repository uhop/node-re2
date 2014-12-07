#include <vector>
#include <string>
#include <memory>

#include <iostream>

#include <node.h>
#include <node_buffer.h>
#include <nan.h>

#include <re2/re2.h>


using std::vector;
using std::string;
using std::auto_ptr;

using v8::FunctionTemplate;
using v8::ObjectTemplate;
using v8::Persistent;
using v8::Function;
using v8::Handle;
using v8::Object;
using v8::Array;
using v8::String;
using v8::Integer;
using v8::Boolean;
using v8::Local;
using v8::Value;

using node::ObjectWrap;
using node::Buffer;

using re2::RE2;
using re2::StringPiece;


class WrappedRE2 : public node::ObjectWrap {

	private:
		RE2		regexp;
		bool	global;
		bool	ignoreCase;
		bool	multiline;
		size_t	lastIndex;

		WrappedRE2(const StringPiece& pattern, const RE2::Options& options,
			const bool& g, const bool& i, const bool& m) : regexp(pattern, options),
				global(g), ignoreCase(i), multiline(m), lastIndex(0) {}

		static NAN_METHOD(New);

		static NAN_GETTER(GetSource);
		static NAN_GETTER(GetGlobal);
		static NAN_GETTER(GetIgnoreCase);
		static NAN_GETTER(GetMultiline);
		static NAN_GETTER(GetLastIndex);
		static NAN_SETTER(SetLastIndex);

		// RegExp methods
		static NAN_METHOD(Exec);
		static NAN_METHOD(Test);

		// String methods
		static NAN_METHOD(Match);
		static NAN_METHOD(Replace);
		static NAN_METHOD(Search);
		static NAN_METHOD(Split);

		static Persistent<Function>	constructor;

	public:
		static void Initialize(Handle<Object> exports, Handle<Object> module);
};


NAN_METHOD(WrappedRE2::New) {
	NanScope();

	if (args.IsConstructCall()) {
		// process arguments

		NanUtf8String pattern(args[0]);

		bool ignoreCase = false;
		bool multiline = false;
		bool global = false;

		RE2::Options options;

		if (args.Length() > 1) {
			NanUtf8String flags(args[1]);
			const char* p = *flags;
			for (size_t i = 0, n = flags.Size() - 1; i < n; ++i) {
				switch (p[i]) {
					case 'i':
						ignoreCase = true;
						break;
					case 'm':
						multiline = true;
						break;
					case 'g':
						global = true;
						break;
				}
			}
		}

		options.set_case_sensitive(!ignoreCase);
		options.set_one_line(!multiline);

		// create and return an object

		WrappedRE2* re2 = new WrappedRE2(StringPiece(*pattern, pattern.Size() - 1),
			options, global, ignoreCase, multiline);
		re2->Wrap(args.This());
		return args.This();
	}

	// call a constructor and return the result

	vector< Local<Value> > parameters(args.Length());
	for (size_t i = 0, n = args.Length(); i < n; ++i) {
		parameters[i] = args[i];
	}
    NanReturnValue(constructor->NewInstance(parameters.size(), &parameters[0]));
}


NAN_METHOD(WrappedRE2::Exec) {
	NanScope();

	// unpack arguments

	WrappedRE2* re2 = ObjectWrap::Unwrap<WrappedRE2>(args.This());
	if (!re2) {
		NanReturnNull();
	}

	auto_ptr<NanUtf8String> buffer;

	char*  data;
	size_t size;
	if (args[0]->IsString()){
		buffer.reset(new NanUtf8String(args[0]));
		data = **buffer;
		size = buffer->Size() - 1;
	} else if (Buffer::HasInstance(args[0])) {
		data = Buffer::Data(args[0]);
		size = Buffer::Length(args[0]);
	} else {
		NanReturnNull();
	}

	// actual work

	if (re2->lastIndex > size) {
		re2->lastIndex = 0;
		NanReturnNull();
	}

	vector<StringPiece> groups(re2->regexp.NumberOfCapturingGroups() + 1);

	if (!re2->regexp.Match(StringPiece(data, size), re2->lastIndex, size, RE2::UNANCHORED, &groups[0], groups.size())) {
		NanReturnNull();
	}

	// form a result

	Local<Array> result = NanNew<Array>();
	for (size_t i = 0, n = groups.size(); i < n; ++i) {
		const StringPiece& item = groups[i];
		result->Set(NanNew<Integer>(i), NanNew<String>(item.data(), item.size()));
	}
	result->Set(NanNew<String>("index"), NanNew<Integer>(groups[0].data() - data));
	result->Set(NanNew<String>("input"), args[0]);

	if (re2->global) {
		re2->lastIndex = groups[0].data() - data + groups[0].size();
	}

	NanReturnValue(result);
}


NAN_METHOD(WrappedRE2::Test) {
	NanScope();

	// unpack arguments

	WrappedRE2* re2 = ObjectWrap::Unwrap<WrappedRE2>(args.This());
	if (!re2) {
		NanReturnValue(NanNew(false));
	}

	auto_ptr<NanUtf8String> buffer;

	char*  data;
	size_t size;
	if (args[0]->IsString()){
		buffer.reset(new NanUtf8String(args[0]));
		data = **buffer;
		size = buffer->Size() - 1;
	} else if (Buffer::HasInstance(args[0])) {
		data = Buffer::Data(args[0]);
		size = Buffer::Length(args[0]);
	} else {
		NanReturnValue(NanNew(false));
	}

	// actual work

	if (re2->lastIndex > size) {
		re2->lastIndex = 0;
		NanReturnValue(NanNew(false));
	}

	NanReturnValue(NanNew(
		re2->regexp.Match(StringPiece(data, size), re2->lastIndex, size, RE2::UNANCHORED, NULL, 0)));
}


NAN_METHOD(WrappedRE2::Match) {
	NanScope();
	NanReturnUndefined();
}


NAN_METHOD(WrappedRE2::Replace) {
	NanScope();
	NanReturnUndefined();
}


NAN_METHOD(WrappedRE2::Search) {
	NanScope();
	NanReturnUndefined();
}


NAN_METHOD(WrappedRE2::Split) {
	NanScope();
	NanReturnUndefined();
}


// getters/setters


NAN_GETTER(WrappedRE2::GetSource) {
	NanScope();
	WrappedRE2* re2 = ObjectWrap::Unwrap<WrappedRE2>(args.This());
	NanReturnValue(NanNew<String>(re2->regexp.pattern()));
}


NAN_GETTER(WrappedRE2::GetGlobal) {
	NanScope();
	WrappedRE2* re2 = ObjectWrap::Unwrap<WrappedRE2>(args.This());
	NanReturnValue(NanNew(re2->global));
}


NAN_GETTER(WrappedRE2::GetIgnoreCase) {
	NanScope();
	WrappedRE2* re2 = ObjectWrap::Unwrap<WrappedRE2>(args.This());
	NanReturnValue(NanNew(re2->ignoreCase));
}


NAN_GETTER(WrappedRE2::GetMultiline) {
	NanScope();
	WrappedRE2* re2 = ObjectWrap::Unwrap<WrappedRE2>(args.This());
	NanReturnValue(NanNew(re2->multiline));
}


NAN_GETTER(WrappedRE2::GetLastIndex) {
	NanScope();
	WrappedRE2* re2 = ObjectWrap::Unwrap<WrappedRE2>(args.This());
	NanReturnValue(NanNew<Integer>(re2->lastIndex));
}


NAN_SETTER(WrappedRE2::SetLastIndex) {
	NanScope();
	WrappedRE2* re2 = ObjectWrap::Unwrap<WrappedRE2>(args.This());
	if (value->IsNumber()) {
		int n = value->NumberValue();
		re2->lastIndex = n <= 0 ? 0 : n;
	}
}


// module initialization


Persistent<Function> WrappedRE2::constructor;

void WrappedRE2::Initialize(Handle<Object> exports, Handle<Object> module) {

	// prepare constructor template
	Local<FunctionTemplate> tpl = NanNew<FunctionTemplate>(New);
	tpl->SetClassName(NanNew<String>("RE2"));
	tpl->InstanceTemplate()->SetInternalFieldCount(1);

	// prototype

	NODE_SET_PROTOTYPE_METHOD(tpl, "exec",    Exec);
	NODE_SET_PROTOTYPE_METHOD(tpl, "test",    Test);

	NODE_SET_PROTOTYPE_METHOD(tpl, "match",   Match);
	NODE_SET_PROTOTYPE_METHOD(tpl, "replace", Replace);
	NODE_SET_PROTOTYPE_METHOD(tpl, "search",  Search);
	NODE_SET_PROTOTYPE_METHOD(tpl, "split",   Split);

	Local<ObjectTemplate> proto = tpl->PrototypeTemplate();
	proto->SetAccessor(NanNew<String>("source"),     GetSource);
	proto->SetAccessor(NanNew<String>("global"),     GetGlobal);
	proto->SetAccessor(NanNew<String>("ignoreCase"), GetIgnoreCase);
	proto->SetAccessor(NanNew<String>("multiline"),  GetMultiline);
	proto->SetAccessor(NanNew<String>("lastIndex"),  GetLastIndex, SetLastIndex);

	constructor = Persistent<Function>::New(tpl->GetFunction());

	// return constructor as module's export
	module->Set(NanNew<String>("exports"), constructor);
}


void Initialize(Handle<Object> exports, Handle<Object> module) {
	WrappedRE2::Initialize(exports, module);
}

NODE_MODULE(re2, Initialize)
