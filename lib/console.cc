#include "./util.h"

#include <string>

#include <sys/types.h>
#include <unistd.h>


using v8::Local;
using v8::MaybeLocal;
using v8::Object;
using v8::String;
using v8::Value;
using std::string;


template<typename R, typename P, typename L>
inline MaybeLocal<R> bind(MaybeLocal<P> param, L lambda) {
	if (param.IsEmpty()) return MaybeLocal<R>();

	return lambda(param.ToLocalChecked());
}


void consoleCall(const Local<String>& methodName, Local<Value> text) {
	Local<v8::Context> context = v8::Isolate::GetCurrent()->GetCurrentContext();

	MaybeLocal<Object> maybeConsole = bind<Object>(
		Nan::Get(context->Global(), Nan::New("console").ToLocalChecked()),
		[context] (Local<Value> console) { return console->ToObject(context); });
	if (maybeConsole.IsEmpty()) return;

	Local<Object> console = maybeConsole.ToLocalChecked();

	MaybeLocal<Object> maybeMethod = bind<Object>(
		Nan::Get(console, methodName),
		[context] (Local<Value> method) { return method->ToObject(context); });
	if (maybeMethod.IsEmpty()) return;

	Local<Object> method = maybeMethod.ToLocalChecked();
	if (!method->IsFunction()) return;

	Nan::Call(method.As<Function>(), console, 1, &text);
}


void printDeprecationWarning(const char* warning) {
	string prefixedWarning;
	prefixedWarning.resize(29 + sizeof(pid_t) * 3 + strlen(warning));
	prefixedWarning.resize(snprintf(
		&prefixedWarning[0], prefixedWarning.size(),
		"(node:%d) DeprecationWarning: %s",
		getpid(), warning));

	consoleCall(Nan::New("error").ToLocalChecked(), Nan::New(prefixedWarning).ToLocalChecked());
}
