#include "./wrapped_re2.h"
#include "./util.h"

#include <map>
#include <memory>
#include <string>
#include <unordered_set>
#include <vector>

static char hex[] = {'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'};

inline bool isUpperCaseAlpha(char ch)
{
	return 'A' <= ch && ch <= 'Z';
}

inline bool isHexadecimal(char ch)
{
	return ('0' <= ch && ch <= '9') || ('A' <= ch && ch <= 'Z') || ('a' <= ch && ch <= 'z');
}

static std::map<std::string, std::string> unicodeClasses = {
	{"Uppercase_Letter", "Lu"},
	{"Lowercase_Letter", "Ll"},
	{"Titlecase_Letter", "Lt"},
	{"Cased_Letter", "LC"},
	{"Modifier_Letter", "Lm"},
	{"Other_Letter", "Lo"},
	{"Letter", "L"},
	{"Nonspacing_Mark", "Mn"},
	{"Spacing_Mark", "Mc"},
	{"Enclosing_Mark", "Me"},
	{"Mark", "M"},
	{"Decimal_Number", "Nd"},
	{"Letter_Number", "Nl"},
	{"Other_Number", "No"},
	{"Number", "N"},
	{"Connector_Punctuation", "Pc"},
	{"Dash_Punctuation", "Pd"},
	{"Open_Punctuation", "Ps"},
	{"Close_Punctuation", "Pe"},
	{"Initial_Punctuation", "Pi"},
	{"Final_Punctuation", "Pf"},
	{"Other_Punctuation", "Po"},
	{"Punctuation", "P"},
	{"Math_Symbol", "Sm"},
	{"Currency_Symbol", "Sc"},
	{"Modifier_Symbol", "Sk"},
	{"Other_Symbol", "So"},
	{"Symbol", "S"},
	{"Space_Separator", "Zs"},
	{"Line_Separator", "Zl"},
	{"Paragraph_Separator", "Zp"},
	{"Separator", "Z"},
	{"Control", "Cc"},
	{"Format", "Cf"},
	{"Surrogate", "Cs"},
	{"Private_Use", "Co"},
	{"Unassigned", "Cn"},
	{"Other", "C"},
};

static bool translateRegExp(const char *data, size_t size, bool multiline, std::vector<char> &buffer)
{
	std::string result;
	bool changed = false;

	if (!size)
	{
		result = "(?:)";
		changed = true;
	}
	else if (multiline)
	{
		result = "(?m)";
		changed = true;
	}

	for (size_t i = 0; i < size;)
	{
		char ch = data[i];
		if (ch == '\\')
		{
			if (i + 1 < size)
			{
				ch = data[i + 1];
				switch (ch)
				{
				case '\\':
					result += "\\\\";
					i += 2;
					continue;
				case 'c':
					if (i + 2 < size)
					{
						ch = data[i + 2];
						if (isUpperCaseAlpha(ch))
						{
							result += "\\x";
							result += hex[((ch - '@') / 16) & 15];
							result += hex[(ch - '@') & 15];
							i += 3;
							changed = true;
							continue;
						}
					}
					result += "\\c";
					i += 2;
					continue;
				case 'u':
					if (i + 2 < size)
					{
						ch = data[i + 2];
						if (isHexadecimal(ch))
						{
							result += "\\x{";
							result += ch;
							i += 3;
							for (size_t j = 0; j < 3 && i < size; ++i, ++j)
							{
								ch = data[i];
								if (!isHexadecimal(ch))
								{
									break;
								}
								result += ch;
							}
							result += '}';
							changed = true;
							continue;
						}
						else if (ch == '{')
						{
							result += "\\x";
							i += 2;
							changed = true;
							continue;
						}
					}
					result += "\\u";
					i += 2;
					continue;
				case 'p':
				case 'P':
					if (i + 2 < size) {
						if (data[i + 2] == '{') {
							size_t j = i + 3;
							while (j < size && data[j] != '}') ++j;
							if (j < size) {
								result += "\\";
								result += data[i + 1];
								std::string name(data + i + 3, j - i - 3);
								if (unicodeClasses.find(name) != unicodeClasses.end()) {
									name = unicodeClasses[name];
								} else if (name.size() > 7 && !strncmp(name.c_str(), "Script=", 7)) {
									name = name.substr(7);
								} else if (name.size() > 3 && !strncmp(name.c_str(), "sc=", 3)) {
									name = name.substr(3);
								}
								if (name.size() == 1) {
									result += name;
								} else {
									result += "{";
									result += name;
									result += "}";
								}
								i = j + 1;
								changed = true;
								continue;
							}
						}
					}
					result += "\\";
					result += data[i + 1];
					i += 2;
					continue;
				default:
					result += "\\";
					size_t sym_size = getUtf8CharSize(ch);
					result.append(data + i + 1, sym_size);
					i += sym_size + 1;
					continue;
				}
			}
		}
		else if (ch == '/')
		{
			result += "\\/";
			i += 1;
			changed = true;
			continue;
		}
		else if (ch == '(' && i + 2 < size && data[i + 1] == '?' && data[i + 2] == '<')
		{
			if (i + 3 >= size || (data[i + 3] != '=' && data[i + 3] != '!'))
			{
				result += "(?P<";
				i += 3;
				changed = true;
				continue;
			}
		}
		size_t sym_size = getUtf8CharSize(ch);
		result.append(data + i, sym_size);
		i += sym_size;
	}

	if (!changed)
	{
		return false;
	}

	buffer.resize(0);
	buffer.insert(buffer.end(), result.data(), result.data() + result.size());
	buffer.push_back('\0');

	return true;
}

static std::string escapeRegExp(const char *data, size_t size)
{
	std::string result;

	if (!size)
	{
		result = "(?:)";
	}

	size_t prevBackSlashes = 0;
	for (size_t i = 0; i < size;)
	{
		char ch = data[i];
		if (ch == '\\')
		{
			++prevBackSlashes;
		}
		else if (ch == '/' && !(prevBackSlashes & 1))
		{
			result += "\\/";
			i += 1;
			prevBackSlashes = 0;
			continue;
		}
		else
		{
			prevBackSlashes = 0;
		}
		size_t sym_size = getUtf8CharSize(ch);
		result.append(data + i, sym_size);
		i += sym_size;
	}

	return result;
}

bool WrappedRE2::alreadyWarnedAboutUnicode = false;

static const char *deprecationMessage = "BMP patterns aren't supported by node-re2. An implicit \"u\" flag is assumed by the RE2 constructor. In a future major version, calling the RE2 constructor without the \"u\" flag may become forbidden, or cause a different behavior. Please see https://github.com/uhop/node-re2/issues/21 for more information.";

inline bool ensureUniqueNamedGroups(const std::map<int, std::string> &groups)
{
	std::unordered_set<std::string> names;

	for (auto group : groups)
	{
		if (!names.insert(group.second).second)
		{
			return false;
		}
	}

	return true;
}

NAN_METHOD(WrappedRE2::New)
{

	if (!info.IsConstructCall())
	{
		// call a constructor and return the result

		std::vector<v8::Local<v8::Value>> parameters(info.Length());
		for (size_t i = 0, n = info.Length(); i < n; ++i)
		{
			parameters[i] = info[i];
		}
		auto isolate = v8::Isolate::GetCurrent();
		auto p_tpl = Nan::GetIsolateData<Nan::Persistent<v8::FunctionTemplate>>(isolate);
		auto newObject = Nan::NewInstance(Nan::GetFunction(p_tpl->Get(isolate)).ToLocalChecked(), parameters.size(), &parameters[0]);
		if (!newObject.IsEmpty())
		{
			info.GetReturnValue().Set(newObject.ToLocalChecked());
		}
		return;
	}

	// process arguments

	std::vector<char> buffer;

	char *data = NULL;
	size_t size = 0;

	std::string source;
	bool global = false;
	bool ignoreCase = false;
	bool multiline = false;
	bool dotAll = false;
	bool unicode = false;
	bool sticky = false;
	bool hasIndices = false;

	auto context = Nan::GetCurrentContext();
	bool needFlags = true;

	if (info.Length() > 1)
	{
		if (info[1]->IsString())
		{
			auto isolate = v8::Isolate::GetCurrent();
			auto t = info[1]->ToString(Nan::GetCurrentContext());
			auto s = t.ToLocalChecked();
			size = s->Utf8Length(isolate);
			buffer.resize(size + 1);
			data = &buffer[0];
			s->WriteUtf8(isolate, data, buffer.size());
			buffer[size] = '\0';
		}
		else if (node::Buffer::HasInstance(info[1]))
		{
			size = node::Buffer::Length(info[1]);
			data = node::Buffer::Data(info[1]);
		}
		for (size_t i = 0; i < size; ++i)
		{
			switch (data[i])
			{
			case 'g':
				global = true;
				break;
			case 'i':
				ignoreCase = true;
				break;
			case 'm':
				multiline = true;
				break;
			case 's':
				dotAll = true;
				break;
			case 'u':
				unicode = true;
				break;
			case 'y':
				sticky = true;
				break;
			case 'd':
				hasIndices = true;
				break;
			}
		}
		size = 0;
		needFlags = false;
	}

	bool needConversion = true;

	if (node::Buffer::HasInstance(info[0]))
	{
		size = node::Buffer::Length(info[0]);
		data = node::Buffer::Data(info[0]);

		source = escapeRegExp(data, size);
	}
	else if (info[0]->IsRegExp())
	{
		const auto *re = v8::RegExp::Cast(*info[0]);

		auto isolate = v8::Isolate::GetCurrent();
		auto t = re->GetSource()->ToString(Nan::GetCurrentContext());
		auto s = t.ToLocalChecked();
		size = s->Utf8Length(isolate);
		buffer.resize(size + 1);
		data = &buffer[0];
		s->WriteUtf8(isolate, data, buffer.size());
		buffer[size] = '\0';

		source = escapeRegExp(data, size);

		if (needFlags)
		{
			v8::RegExp::Flags flags = re->GetFlags();
			global = bool(flags & v8::RegExp::kGlobal);
			ignoreCase = bool(flags & v8::RegExp::kIgnoreCase);
			multiline = bool(flags & v8::RegExp::kMultiline);
			dotAll = bool(flags & v8::RegExp::kDotAll);
			unicode = bool(flags & v8::RegExp::kUnicode);
			sticky = bool(flags & v8::RegExp::kSticky);
			hasIndices = bool(flags & v8::RegExp::kHasIndices);
			needFlags = false;
		}
	}
	else if (info[0]->IsObject() && !info[0]->IsString())
	{
		WrappedRE2 *re2 = nullptr;
		auto object = info[0]->ToObject(context).ToLocalChecked();
		if (!object.IsEmpty() && object->InternalFieldCount() > 0)
		{
			re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(object);
		}
		if (re2)
		{
			const auto &pattern = re2->regexp.pattern();
			size = pattern.size();
			buffer.resize(size);
			data = &buffer[0];
			memcpy(data, pattern.data(), size);
			needConversion = false;

			source = re2->source;

			if (needFlags)
			{
				global = re2->global;
				ignoreCase = re2->ignoreCase;
				multiline = re2->multiline;
				dotAll = re2->dotAll;
				unicode = true;
				sticky = re2->sticky;
				hasIndices = re2->hasIndices;
				needFlags = false;
			}
		}
	}
	else if (info[0]->IsString())
	{
		auto isolate = v8::Isolate::GetCurrent();
		auto t = info[0]->ToString(Nan::GetCurrentContext());
		auto s = t.ToLocalChecked();
		size = s->Utf8Length(isolate);
		buffer.resize(size + 1);
		data = &buffer[0];
		s->WriteUtf8(isolate, data, buffer.size());
		buffer[size] = '\0';

		source = escapeRegExp(data, size);
	}

	if (!data)
	{
		return Nan::ThrowTypeError("Expected string, Buffer, RegExp, or RE2 as the 1st argument.");
	}

	if (!unicode)
	{
		switch (unicodeWarningLevel)
		{
		case THROW:
			return Nan::ThrowSyntaxError(deprecationMessage);
		case WARN:
			printDeprecationWarning(deprecationMessage);
			break;
		case WARN_ONCE:
			if (!alreadyWarnedAboutUnicode)
			{
				printDeprecationWarning(deprecationMessage);
				alreadyWarnedAboutUnicode = true;
			}
			break;
		default:
			break;
		}
	}

	if (needConversion && translateRegExp(data, size, multiline, buffer))
	{
		size = buffer.size() - 1;
		data = &buffer[0];
	}

	// create and return an object

	re2::RE2::Options options;
	options.set_case_sensitive(!ignoreCase);
	options.set_one_line(!multiline); // to track this state, otherwise it is ignored
	options.set_dot_nl(dotAll);
	options.set_log_errors(false); // inappropriate when embedding

	std::unique_ptr<WrappedRE2> re2(new WrappedRE2(re2::StringPiece(data, size), options, source, global, ignoreCase, multiline, dotAll, sticky, hasIndices));
	if (!re2->regexp.ok())
	{
		return Nan::ThrowSyntaxError(re2->regexp.error().c_str());
	}
	if (!ensureUniqueNamedGroups(re2->regexp.CapturingGroupNames()))
	{
		return Nan::ThrowSyntaxError("duplicate capture group name");
	}
	re2->Wrap(info.This());
	re2.release();

	info.GetReturnValue().Set(info.This());
}
