#ifndef UTIL_H_
#define UTIL_H_

#include "./wrapped_re2.h"

#include <vector>


struct StrVal {
	std::vector<char> buffer;
	char*  data;
	size_t size, length;
	bool   isBuffer;

	StrVal() : data(NULL), size(0), length(0), isBuffer(false) {}
	StrVal(const Local<v8::Value>& arg);

	operator StringPiece () const { return StringPiece(data, size); }
};


template<typename R, typename P, typename L>
inline v8::MaybeLocal<R> bind(v8::MaybeLocal<P> param, L lambda) {
	if (param.IsEmpty()) return v8::MaybeLocal<R>();

	return lambda(param.ToLocalChecked());
}

void consoleCall(const Local<v8::String>& methodName, Local<v8::Value> text);
void printDeprecationWarning(const char* warning);

Local<v8::String> callToString(const Local<Object>& object);


#endif
