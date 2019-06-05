#ifndef UTIL_H_
#define UTIL_H_

#include "./wrapped_re2.h"

#include <vector>

struct StrVal
{
	std::vector<char> buffer;
	char *data;
	size_t size, length;
	bool isBuffer;

	StrVal() : data(NULL), size(0), length(0), isBuffer(false) {}
	StrVal(const v8::Local<v8::Value> &arg);

	operator re2::StringPiece() const { return re2::StringPiece(data, size); }
};

template <typename R, typename P, typename L>
inline v8::MaybeLocal<R> bind(v8::MaybeLocal<P> param, L lambda)
{
	return param.IsEmpty() ? v8::MaybeLocal<R>() : lambda(param.ToLocalChecked());
}

void consoleCall(const v8::Local<v8::String> &methodName, v8::Local<v8::Value> text);
void printDeprecationWarning(const char *warning);

v8::Local<v8::String> callToString(const v8::Local<v8::Object> &object);

#endif
