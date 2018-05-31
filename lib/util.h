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
	StrVal(const v8::Local<v8::Value>& arg);

	operator StringPiece () { return StringPiece(data, size); }
	operator const StringPiece () const { return StringPiece(data, size); }
};


void consoleCall(const v8::Local<v8::String>& methodName, Local<v8::Value> text);
void printDeprecationWarning(const char* warning);


#endif
