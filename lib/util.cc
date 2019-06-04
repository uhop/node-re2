#include "./util.h"

#include <sys/types.h>
#include <string>

#include <node_buffer.h>


using v8::Local;
using v8::MaybeLocal;
using v8::String;
using v8::Value;
using v8::Isolate;
using v8::Object;

using std::string;


StrVal::StrVal(const Local<Value>& arg) : data(NULL), size(0), isBuffer(false) {
	if (node::Buffer::HasInstance(arg)) {
		isBuffer = true;
		size = length = node::Buffer::Length(arg);
		data = node::Buffer::Data(arg);
	} else {
		auto isolate = Isolate::GetCurrent();
		auto ctx = isolate->GetCurrentContext();
		auto t(arg->ToString(ctx));
		if (!t.IsEmpty()) {
			auto s = t.ToLocalChecked();
			length = s->Length();
			size = s->Utf8Length(isolate);
			buffer.resize(size + 1);
			data = &buffer[0];
			s->WriteUtf8(isolate, data);
		}
	}
}

void consoleCall(const Local<String>& methodName, Local<Value> text) {
	auto context = Isolate::GetCurrent()->GetCurrentContext();

	auto maybeConsole = bind<Object>(
		Nan::Get(context->Global(), Nan::New("console").ToLocalChecked()),
		[context] (Local<Value> console) { return console->ToObject(context); });
	if (maybeConsole.IsEmpty()) return;

	auto console = maybeConsole.ToLocalChecked();

	auto maybeMethod = bind<Object>(
		Nan::Get(console, methodName),
		[context] (Local<Value> method) { return method->ToObject(context); });
	if (maybeMethod.IsEmpty()) return;

	auto method = maybeMethod.ToLocalChecked();
	if (!method->IsFunction()) return;

	Nan::Call(method.As<Function>(), console, 1, &text);
}


void printDeprecationWarning(const char* warning) {
	string prefixedWarning = "DeprecationWarning: ";
	prefixedWarning += warning;
	consoleCall(Nan::New("error").ToLocalChecked(), Nan::New(prefixedWarning).ToLocalChecked());
}

Local<v8::String> callToString(const Local<Object>& object) {
	auto context = Isolate::GetCurrent()->GetCurrentContext();

	auto maybeMethod = bind<Object>(
		Nan::Get(object, Nan::New("toString").ToLocalChecked()),
		[context] (Local<Value> method) { return method->ToObject(context); });
	if (maybeMethod.IsEmpty()) return Nan::New("No toString() is found").ToLocalChecked();

	auto method = maybeMethod.ToLocalChecked();
	if (!method->IsFunction()) return Nan::New("No toString() is found").ToLocalChecked();

	auto maybeResult = Nan::Call(method.As<Function>(), object, 0, nullptr);
	if (maybeResult.IsEmpty()) {
		return Nan::New("nothing was returned").ToLocalChecked();
	}

	Local<Value> result = maybeResult.ToLocalChecked();

	if (result->IsObject()) {
		return callToString(result->ToObject(context).ToLocalChecked());
	}

	Nan::Utf8String val(result->ToString(context).ToLocalChecked());
	return Nan::New(string(*val, val.length())).ToLocalChecked();
}
