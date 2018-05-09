#ifndef UTIL_H_
#define UTIL_H_

#include "./wrapped_re2.h"

#include <vector>


struct StrVal {
	std::vector<char> buffer;
	char*  data;
	size_t size;
	bool   isBuffer;

	StrVal() : data(NULL), size(0), isBuffer(false) {}
	StrVal(const v8::Local<v8::Value>& arg);

	inline bool IsEmpty() const { return data == NULL; }

	operator StringPiece () { return StringPiece(data, size); }
	operator const StringPiece () const { return StringPiece(data, size); }
};


template<typename T>
class ToStringHelper {
		T* value_;

	public:
		inline ToStringHelper(const v8::Local<v8::Value>& value) : value_(NULL) {
			v8::MaybeLocal<v8::String> str(value->ToString(v8::Isolate::GetCurrent()->GetCurrentContext()));
			if (!str.IsEmpty()) {
				value_ = new T(str.ToLocalChecked());
			}
		}
		ToStringHelper(const ToStringHelper&) = delete;
		inline ~ToStringHelper() {
			if (value_) {
				delete value_;
			}
		}

		ToStringHelper& operator =(const ToStringHelper&) = delete;

		inline bool IsEmpty() const { return value_ == NULL; }

		inline T& Unwrap() { return *value_; }
		inline const T& Unwrap() const { return *value_; }
};


class Utf8LastIndexGuard {
		WrappedRE2*   re2_;
		const StrVal& utf8Input_;

	public:
		Utf8LastIndexGuard(WrappedRE2* re2, const v8::Local<v8::Value>& utf16Input, const StrVal& utf8Input);
		Utf8LastIndexGuard(const Utf8LastIndexGuard&) = delete;
		~Utf8LastIndexGuard();

		Utf8LastIndexGuard& operator =(const Utf8LastIndexGuard&) = delete;
};


#endif
