#pragma once

#include "./wrapped_re2.h"

template <typename R, typename P, typename L>
inline v8::MaybeLocal<R> bind(v8::MaybeLocal<P> param, L lambda)
{
	return param.IsEmpty() ? v8::MaybeLocal<R>() : lambda(param.ToLocalChecked());
}

void consoleCall(const v8::Local<v8::String> &methodName, v8::Local<v8::Value> text);
void printDeprecationWarning(const char *warning);

v8::Local<v8::String> callToString(const v8::Local<v8::Object> &object);
