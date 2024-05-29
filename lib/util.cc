#include "./util.h"

void consoleCall(const v8::Local<v8::String> &methodName, v8::Local<v8::Value> text)
{
	auto context = Nan::GetCurrentContext();

	auto maybeConsole = bind<v8::Object>(
		Nan::Get(context->Global(), Nan::New("console").ToLocalChecked()),
		[context](v8::Local<v8::Value> console) { return console->ToObject(context); });
	if (maybeConsole.IsEmpty())
		return;

	auto console = maybeConsole.ToLocalChecked();

	auto maybeMethod = bind<v8::Object>(
		Nan::Get(console, methodName),
		[context](v8::Local<v8::Value> method) { return method->ToObject(context); });
	if (maybeMethod.IsEmpty())
		return;

	auto method = maybeMethod.ToLocalChecked();
	if (!method->IsFunction())
		return;

	Nan::CallAsFunction(method, console, 1, &text);
}

void printDeprecationWarning(const char *warning)
{
	std::string prefixedWarning = "DeprecationWarning: ";
	prefixedWarning += warning;
	consoleCall(Nan::New("error").ToLocalChecked(), Nan::New(prefixedWarning).ToLocalChecked());
}

v8::Local<v8::String> callToString(const v8::Local<v8::Object> &object)
{
	auto context = Nan::GetCurrentContext();

	auto maybeMethod = bind<v8::Object>(
		Nan::Get(object, Nan::New("toString").ToLocalChecked()),
		[context](v8::Local<v8::Value> method) { return method->ToObject(context); });
	if (maybeMethod.IsEmpty())
		return Nan::New("No toString() is found").ToLocalChecked();

	auto method = maybeMethod.ToLocalChecked();
	if (!method->IsFunction())
		return Nan::New("No toString() is found").ToLocalChecked();

	auto maybeResult = Nan::CallAsFunction(method, object, 0, nullptr);
	if (maybeResult.IsEmpty())
	{
		return Nan::New("nothing was returned").ToLocalChecked();
	}

	auto result = maybeResult.ToLocalChecked();

	if (result->IsObject())
	{
		return callToString(result->ToObject(context).ToLocalChecked());
	}

	Nan::Utf8String val(result->ToString(context).ToLocalChecked());
	return Nan::New(std::string(*val, val.length())).ToLocalChecked();
}
