#include "./wrapped_re2.h"

#include <node_buffer.h>


using v8::FunctionTemplate;
using v8::Integer;
using v8::Local;
using v8::ObjectTemplate;
using v8::String;


Persistent<Function> WrappedRE2::constructor;


static NAN_METHOD(GetUtf8Length) {
	NanScope();
	String::Value s(args[0]->ToString());
	NanReturnValue(NanNew<Integer>(static_cast<int>(getUtf8Length(*s, *s + s.length()))));
}


static NAN_METHOD(GetUtf16Length) {
	NanScope();
	if (node::Buffer::HasInstance(args[0])) {
		char* s = node::Buffer::Data(args[0]);
		NanReturnValue(NanNew<Integer>(static_cast<int>(getUtf16Length(s, s + node::Buffer::Length(args[0])))));
	}
	NanReturnValue(NanNew(-1));
}


void WrappedRE2::Initialize(Handle<Object> exports, Handle<Object> module) {

	// prepare constructor template
	Local<FunctionTemplate> tpl = NanNew<FunctionTemplate>(New);
	tpl->SetClassName(NanNew("RE2"));
	tpl->InstanceTemplate()->SetInternalFieldCount(1);

	// prototype

	NODE_SET_PROTOTYPE_METHOD(tpl, "toString", ToString);

	NODE_SET_PROTOTYPE_METHOD(tpl, "exec",     Exec);
	NODE_SET_PROTOTYPE_METHOD(tpl, "test",     Test);

	NODE_SET_PROTOTYPE_METHOD(tpl, "match",    Match);
	NODE_SET_PROTOTYPE_METHOD(tpl, "replace",  Replace);
	NODE_SET_PROTOTYPE_METHOD(tpl, "search",   Search);
	NODE_SET_PROTOTYPE_METHOD(tpl, "split",    Split);

	Local<ObjectTemplate> proto = tpl->PrototypeTemplate();
	proto->SetAccessor(NanNew("source"),     GetSource);
	proto->SetAccessor(NanNew("global"),     GetGlobal);
	proto->SetAccessor(NanNew("ignoreCase"), GetIgnoreCase);
	proto->SetAccessor(NanNew("multiline"),  GetMultiline);
	proto->SetAccessor(NanNew("lastIndex"),  GetLastIndex, SetLastIndex);

	Local<Function> fun = tpl->GetFunction();
	fun->Set(NanNew("getUtf8Length"), NanNew<FunctionTemplate>(GetUtf8Length)->GetFunction());
	fun->Set(NanNew("getUtf16Length"), NanNew<FunctionTemplate>(GetUtf16Length)->GetFunction());
	NanAssignPersistent(constructor, fun);

	// return constructor as module's export
	module->Set(NanNew("exports"), fun);
}


void Initialize(Handle<Object> exports, Handle<Object> module) {
	WrappedRE2::Initialize(exports, module);
}


NODE_MODULE(re2, Initialize)
